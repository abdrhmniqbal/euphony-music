import { createId } from "@paralleldrive/cuid2"
import { and, asc, desc, eq, gt, inArray, like, or, sql } from "drizzle-orm"

import { db } from "@/core/db"
import {
  albums,
  appSettings,
  artists,
  playlistTracks,
  playlists,
  trackArtists,
  tracks,
} from "@/core/db/schema"
import { getPreferenceState } from "@/core/preferences/store"
import { logError } from "@/core/log/service"
import { toDataTrack } from "@/domains/tracks/repository"
import { isNumber, isRecord, isString } from "@/lib/guards"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"
import type {
  RecentSearchEntry,
  RecentSearchType,
  SearchAlbumResult,
  SearchArtistResult,
  SearchPlaylistResult,
  SearchResults,
} from "./types"

const RECENT_SEARCHES_SETTINGS_KEY = "library:recent-searches"
const MAX_RECENT_SEARCHES = 30
const RECENT_SEARCH_TYPES: readonly RecentSearchType[] = ["track", "album", "artist", "playlist"]

function normalizeLookup(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
}

export async function searchLibrary(query: string): Promise<SearchResults> {
  const normalizedQuery = query.trim()

  const emptyResults: SearchResults = {
    tracks: [],
    artists: [],
    albums: [],
    playlists: [],
  }

  if (!normalizedQuery) {
    return emptyResults
  }

  try {
    const searchTerm = `%${normalizedQuery}%%`.replace("%%", "%")
    const pattern = `%${normalizedQuery}%`
    void searchTerm

    const featuredArtistTrackMatchIds = db
      .select({ trackId: trackArtists.trackId })
      .from(trackArtists)
      .innerJoin(artists, eq(artists.id, trackArtists.artistId))
      .where(like(artists.name, pattern))

    // SAFETY: title-match rows come from this app's own SQLite schema with artist/album relations registered on the db client, so every joined row matches TrackRowWithRelations
    const [artistRows, albumRows, playlistRows, titleTrackRows] = await Promise.all([
      db.query.artists.findMany({
        where: and(like(artists.name, pattern), gt(artists.trackCount, 0)),
        columns: {
          id: true,
          name: true,
          artwork: true,
          trackCount: true,
        },
        orderBy: [asc(sql`lower(coalesce(${artists.name}, ''))`)],
        limit: 10,
      }),
      db.query.albums.findMany({
        where: and(like(albums.title, pattern), gt(albums.trackCount, 0)),
        with: { artist: true },
        columns: {
          id: true,
          title: true,
          artwork: true,
        },
        orderBy: [asc(sql`lower(coalesce(${albums.title}, ''))`)],
        limit: 10,
      }),
      db.query.playlists.findMany({
        where: like(playlists.name, pattern),
        orderBy: [desc(playlists.updatedAt)],
        limit: 10,
        columns: {
          id: true,
          name: true,
          trackCount: true,
          artwork: true,
        },
        with: {
          tracks: {
            limit: 4,
            orderBy: [asc(playlistTracks.position)],
            columns: {
              trackId: true,
              position: true,
            },
            with: {
              track: {
                columns: {
                  id: true,
                  artwork: true,
                },
                with: {
                  album: {
                    columns: {
                      artwork: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      db.query.tracks.findMany({
        where: and(
          eq(tracks.isDeleted, 0),
          or(like(tracks.title, pattern), inArray(tracks.id, featuredArtistTrackMatchIds))
        ),
        with: {
          artist: true,
          album: true,
        },
        orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
        limit: 20,
      }) as Promise<TrackRowWithRelations[]>,
    ])

    const matchedArtistIds = Array.from(new Set(artistRows.map((artist) => artist.id)))
    const matchedAlbumIds = albumRows.map((album) => album.id)

    const relationTrackFilter =
      matchedArtistIds.length > 0 && matchedAlbumIds.length > 0
        ? or(
            inArray(tracks.artistId, matchedArtistIds),
            inArray(
              tracks.id,
              db
                .select({ trackId: trackArtists.trackId })
                .from(trackArtists)
                .where(inArray(trackArtists.artistId, matchedArtistIds))
            ),
            inArray(tracks.albumId, matchedAlbumIds)
          )
        : matchedArtistIds.length > 0
          ? or(
              inArray(tracks.artistId, matchedArtistIds),
              inArray(
                tracks.id,
                db
                  .select({ trackId: trackArtists.trackId })
                  .from(trackArtists)
                  .where(inArray(trackArtists.artistId, matchedArtistIds))
              )
            )
          : matchedAlbumIds.length > 0
            ? inArray(tracks.albumId, matchedAlbumIds)
            : null

    // SAFETY: relation rows come from the same app-managed tracks schema, so joined artist/album relations match TrackRowWithRelations
    const relationTrackRows = relationTrackFilter
      ? ((await db.query.tracks.findMany({
          where: and(eq(tracks.isDeleted, 0), relationTrackFilter),
          with: {
            artist: true,
            album: true,
          },
          orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
          limit: 40,
        })) as TrackRowWithRelations[])
      : []

    const mergedTrackRows = [...titleTrackRows]
    const seenIds = new Set(mergedTrackRows.map((row) => row.id))

    for (const row of relationTrackRows) {
      if (seenIds.has(row.id)) {
        continue
      }

      seenIds.add(row.id)
      mergedTrackRows.push(row)

      if (mergedTrackRows.length >= 20) {
        break
      }
    }

    const splitConfig = getPreferenceState().splitMultipleValueConfig

    return {
      tracks: mergedTrackRows
        .map((row) =>
          toPlayerTrack(
            toDataTrack({
              id: row.id,
              title: row.title,
              artwork: row.artwork,
              albumId: row.albumId,
              uri: row.uri,
              duration: row.duration,
              dateAdded: row.dateAdded,
              scanTime: row.scanTime,
              rawArtist: row.rawArtist,
              albumName: row.album?.title ?? null,
              artistName: row.artist?.name ?? null,
            }),
            splitConfig
          )
        )
        .filter((track): track is PlayerTrack => track !== null),
      artists: artistRows.map((artist) => ({
        id: artist.id,
        name: artist.name,
        trackCount: artist.trackCount ?? 0,
        image: artist.artwork || undefined,
      })) satisfies SearchArtistResult[],
      albums: albumRows.map((album) => ({
        id: album.id,
        title: album.title,
        artist: album.artist?.name || "Unknown Artist",
        image: album.artwork || undefined,
      })) satisfies SearchAlbumResult[],
      playlists: playlistRows.map((playlist) => ({
        id: playlist.id,
        title: playlist.name,
        trackCount: playlist.trackCount || 0,
        image: playlist.artwork || undefined,
        images: collectPlaylistImages(playlist),
      })) satisfies SearchPlaylistResult[],
    }
  } catch (error) {
    logError("Search query failed", error, { query: normalizedQuery })
    return emptyResults
  }
}

type TrackRowWithRelations = {
  id: string
  title: string
  artwork: string | null
  albumId: string | null
  uri: string
  duration: number
  dateAdded: number | null
  scanTime: number | null
  rawArtist: string | null
  isDeleted: number
  artist: { name: string } | null
  album: { title: string } | null
}

type PlaylistRowWithTracks = {
  id: string
  name: string
  trackCount: number | null
  artwork: string | null
  tracks: Array<{
    track: { artwork: string | null; album: { artwork: string | null } | null } | null
  }>
}

function collectPlaylistImages(playlist: PlaylistRowWithTracks) {
  const images: string[] = []
  for (const entry of playlist.tracks ?? []) {
    const image = entry.track?.artwork ?? entry.track?.album?.artwork ?? null
    if (image && !images.includes(image)) {
      images.push(image)
    }
    if (images.length >= 4) {
      break
    }
  }
  return images
}

function normalizeRecentSearch(value: string | null | undefined) {
  return (value || "").trim()
}

interface RawRecentSearchEntry {
  query?: unknown
  title?: unknown
  subtitle?: unknown
  id?: unknown
  targetId?: unknown
  image?: unknown
  images?: unknown
  createdAt?: unknown
  type?: unknown
}

function normalizeRecentSearchEntry(value: RawRecentSearchEntry): RecentSearchEntry | null {
  const query = isString(value.query) ? value.query.trim() : ""
  if (!query) {
    return null
  }

  const title = (isString(value.title) ? value.title.trim() : "") || query
  const subtitle = (isString(value.subtitle) ? value.subtitle.trim() : "") || "Search"
  const id = (isString(value.id) ? value.id.trim() : "") || createId()
  const targetId = (isString(value.targetId) ? value.targetId.trim() : "") || undefined
  const image = (isString(value.image) ? value.image.trim() : "") || undefined
  const images = Array.isArray(value.images)
    ? value.images
        .map((candidate) => (isString(candidate) ? candidate.trim() : ""))
        .filter((candidate) => candidate.length > 0)
    : undefined
  const createdAt =
    isNumber(value.createdAt) && Number.isFinite(value.createdAt) ? value.createdAt : Date.now()

  return {
    id,
    query,
    title,
    subtitle,
    type: RECENT_SEARCH_TYPES.find((candidate) => candidate === value.type),
    targetId,
    image,
    images,
    createdAt,
  }
}

function getRecentSearchDedupeKey(item: {
  type?: RecentSearchType
  targetId?: string
  query: string
}) {
  const normalizedTargetId = normalizeRecentSearch(item.targetId)
  if (item.type && normalizedTargetId) {
    return `${item.type}:${normalizedTargetId.toLowerCase()}`
  }

  return `${item.type || "query"}:${item.query.toLowerCase()}`
}

function parseRecentSearches(raw: string): RecentSearchEntry[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const normalized = parsed
      .filter(isRecord)
      .map(normalizeRecentSearchEntry)
      .filter((item): item is RecentSearchEntry => item !== null)
      .sort((left, right) => right.createdAt - left.createdAt)

    const seenKeys = new Set<string>()
    const deduped: RecentSearchEntry[] = []
    for (const item of normalized) {
      const key = getRecentSearchDedupeKey(item)
      if (seenKeys.has(key)) {
        continue
      }

      seenKeys.add(key)
      deduped.push(item)

      if (deduped.length >= MAX_RECENT_SEARCHES) {
        break
      }
    }

    return deduped
  } catch {
    return []
  }
}

async function readRecentSearches(): Promise<RecentSearchEntry[]> {
  const row = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, RECENT_SEARCHES_SETTINGS_KEY),
  })

  if (!row) {
    return []
  }

  return parseRecentSearches(row.value)
}

async function writeRecentSearches(items: RecentSearchEntry[]): Promise<void> {
  const now = Date.now()
  const payload = JSON.stringify(items.slice(0, MAX_RECENT_SEARCHES))

  await db
    .insert(appSettings)
    .values({
      key: RECENT_SEARCHES_SETTINGS_KEY,
      value: payload,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: payload,
        updatedAt: now,
      },
    })
}

async function hydrateRecentSearchEntry(item: RecentSearchEntry): Promise<RecentSearchEntry> {
  const normalizedQuery = normalizeLookup(item.query)
  if (!normalizedQuery || !item.type) {
    return item
  }

  if (item.type === "artist") {
    const artist = item.targetId
      ? await db.query.artists.findFirst({
          where: eq(artists.id, item.targetId),
          columns: {
            id: true,
            name: true,
            artwork: true,
          },
        })
      : await db.query.artists.findFirst({
          where: and(
            gt(artists.trackCount, 0),
            eq(sql`lower(coalesce(${artists.name}, ''))`, normalizedQuery)
          ),
          columns: {
            id: true,
            name: true,
            artwork: true,
          },
        })

    if (!artist) {
      return item
    }

    return {
      ...item,
      query: artist.name || item.query,
      title: artist.name || item.title,
      targetId: artist.id,
      image: item.image || artist.artwork || undefined,
    }
  }

  if (item.type === "album") {
    const album = item.targetId
      ? await db.query.albums.findFirst({
          where: eq(albums.id, item.targetId),
          columns: {
            id: true,
            title: true,
            artwork: true,
          },
        })
      : await db.query.albums.findFirst({
          where: and(
            gt(albums.trackCount, 0),
            eq(sql`lower(coalesce(${albums.title}, ''))`, normalizedQuery)
          ),
          columns: {
            id: true,
            title: true,
            artwork: true,
          },
        })

    if (!album) {
      return item
    }

    return {
      ...item,
      query: album.title || item.query,
      title: album.title || item.title,
      targetId: album.id,
      image: item.image || album.artwork || undefined,
    }
  }

  if (item.type === "playlist") {
    const playlist = item.targetId
      ? await db.query.playlists.findFirst({
          where: eq(playlists.id, item.targetId),
          columns: {
            id: true,
            name: true,
            artwork: true,
          },
        })
      : null

    if (!playlist) {
      return item
    }

    return {
      ...item,
      query: playlist.name || item.query,
      title: playlist.name || item.title,
      targetId: playlist.id,
      image: item.image || playlist.artwork || undefined,
    }
  }

  return item
}

export async function getRecentSearches(): Promise<RecentSearchEntry[]> {
  try {
    return await readRecentSearches()
  } catch (error) {
    logError("Failed to read recent searches", error)
    return []
  }
}

export async function addRecentSearch(input: {
  query: string
  title?: string
  subtitle?: string
  type?: RecentSearchType
  targetId?: string
  image?: string
  images?: string[]
}): Promise<RecentSearchEntry[]> {
  try {
    const current = await readRecentSearches()
    const query = normalizeRecentSearch(input.query)
    if (!query) {
      return current
    }

    const hydrated = await hydrateRecentSearchEntry({
      id: createId(),
      createdAt: Date.now(),
      query,
      title: input.title || query,
      subtitle: input.subtitle || "Search",
      type: input.type,
      targetId: input.targetId,
      image: input.image,
      images: input.images,
    })

    const dedupeKey = getRecentSearchDedupeKey(hydrated)
    const filtered = current.filter((item) => getRecentSearchDedupeKey(item) !== dedupeKey)
    const next = [hydrated, ...filtered].slice(0, MAX_RECENT_SEARCHES)
    await writeRecentSearches(next)
    return next
  } catch (error) {
    logError("Failed to add recent search", error)
    return getRecentSearches()
  }
}

export async function deleteRecentSearch(id: string): Promise<RecentSearchEntry[]> {
  try {
    const current = await readRecentSearches()
    const next = current.filter((item) => item.id !== id)
    await writeRecentSearches(next)
    return next
  } catch (error) {
    logError("Failed to delete recent search", error)
    return getRecentSearches()
  }
}

export async function clearRecentSearches(): Promise<RecentSearchEntry[]> {
  try {
    await writeRecentSearches([])
    return []
  } catch (error) {
    logError("Failed to clear recent searches", error)
    return getRecentSearches()
  }
}
