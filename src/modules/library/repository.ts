/**
 * Purpose: Repositories for library browsing, artist lookup, recent-search persistence, and global search results.
 * Caller: Search screens, artist/album detail routes, recent-search mutations, and library query hooks.
 * Dependencies: Drizzle DB client, artist/album/track tables, recent-search settings storage, and track transformers.
 * Main Functions: listArtists(), listAlbums(), getArtistByName(), getTracksByArtistName(), getTracksByAlbumName(), searchLibrary(), addRecentSearch(), getRecentSearches()
 * Side Effects: Reads/writes SQLite rows and app-settings JSON stored in SQLite, updates recent-search persistence, and stores artist artwork and track counts on search result rows.
 */

import type { Track } from "@/modules/player/types"
import { and, asc, desc, eq, gt, inArray, like, or, sql } from "drizzle-orm"

import { db } from "@/db/client"
import {
  albums,
  appSettings,
  artists,
  playlists,
  playlistTracks,
  trackArtists,
  tracks,
} from "@/db/schema"
import { logError } from "@/modules/logging/service"
import { transformDBTrackToTrack } from "@/utils/transformers"
import { collectPlaylistImages } from "@/modules/playlist/repository"
import { getDominantAlbumArtworkMap, selectDominantArtwork } from "./artwork"

import type { AddRecentSearchInput, RecentSearchEntry, SearchResults } from "./types"

const RECENT_SEARCHES_SETTINGS_KEY = "library:recent-searches"
const MAX_RECENT_SEARCHES = 30

function normalizeLookup(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
}

function normalizeRecentSearchQuery(value: string | null | undefined) {
  return (value || "").trim()
}

function getRecentSearchDedupeKey(item: {
  type?: RecentSearchEntry["type"]
  targetId?: string
  query: string
}) {
  const normalizedTargetId = normalizeRecentSearchQuery(item.targetId)
  if (item.type && normalizedTargetId) {
    return `${item.type}:${normalizedTargetId.toLowerCase()}`
  }

  return `${item.type || "query"}:${item.query.toLowerCase()}`
}

function createRecentSearchId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isRecentSearchType(value: unknown): value is RecentSearchEntry["type"] {
  return value === "track" || value === "album" || value === "artist" || value === "playlist"
}

function normalizeRecentSearchEntry(value: unknown): RecentSearchEntry | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const entry = value as Partial<RecentSearchEntry>
  const query = normalizeRecentSearchQuery(entry.query)
  if (!query) {
    return null
  }

  const title = normalizeRecentSearchQuery(entry.title) || query
  const subtitle = normalizeRecentSearchQuery(entry.subtitle) || "Search"
  const id = normalizeRecentSearchQuery(entry.id) || createRecentSearchId()
  const targetId = normalizeRecentSearchQuery(entry.targetId) || undefined
  const image = normalizeRecentSearchQuery(entry.image) || undefined
  const images = Array.isArray(entry.images)
    ? entry.images
        .map((candidate) => normalizeRecentSearchQuery(candidate))
        .filter((candidate): candidate is string => Boolean(candidate))
    : undefined
  const createdAt =
    typeof entry.createdAt === "number" && Number.isFinite(entry.createdAt)
      ? entry.createdAt
      : Date.now()

  return {
    id,
    query,
    title,
    subtitle,
    type: isRecentSearchType(entry.type) ? entry.type : undefined,
    targetId,
    image,
    images,
    createdAt,
  }
}

function parseRecentSearches(raw: string): RecentSearchEntry[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const normalized = parsed
      .map(normalizeRecentSearchEntry)
      .filter((item): item is RecentSearchEntry => item !== null)
      .sort((left, right) => right.createdAt - left.createdAt)

    const seenQueries = new Set<string>()
    const deduped: RecentSearchEntry[] = []
    for (const item of normalized) {
      const key = getRecentSearchDedupeKey(item)
      if (seenQueries.has(key)) {
        continue
      }

      seenQueries.add(key)
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

function areRecentSearchItemsEqual(left: RecentSearchEntry, right: RecentSearchEntry) {
  return (
    left.id === right.id &&
    left.query === right.query &&
    left.title === right.title &&
    left.subtitle === right.subtitle &&
    left.type === right.type &&
    left.targetId === right.targetId &&
    left.image === right.image &&
    JSON.stringify(left.images || []) === JSON.stringify(right.images || []) &&
    left.createdAt === right.createdAt
  )
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
          with: {
            tracks: {
              limit: 1,
              orderBy: [asc(playlistTracks.position)],
              with: {
                track: {
                  with: {
                    album: {
                      with: {
                        artist: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })
      : await db.query.playlists.findFirst({
          where: eq(sql`lower(coalesce(${playlists.name}, ''))`, normalizedQuery),
          columns: {
            id: true,
            name: true,
            artwork: true,
          },
          with: {
            tracks: {
              limit: 1,
              orderBy: [asc(playlistTracks.position)],
              with: {
                track: {
                  with: {
                    album: true,
                  },
                },
              },
            },
          },
        })

    if (!playlist) {
      return item
    }

    const nextImages = new Set<string>([...(item.images || []), ...collectPlaylistImages(playlist)])

    return {
      ...item,
      query: playlist.name || item.query,
      title: playlist.name || item.title,
      targetId: playlist.id,
      image: item.image || playlist.artwork || undefined,
      images: Array.from(nextImages).slice(0, 4),
    }
  }

  return item
}

async function hydrateRecentSearches(items: RecentSearchEntry[]): Promise<RecentSearchEntry[]> {
  const hydrated: RecentSearchEntry[] = []

  for (const item of items) {
    hydrated.push(await hydrateRecentSearchEntry(item))
  }

  return hydrated
}

export async function listArtists(
  orderByField: "name" | "trackCount" | "dateAdded" = "name",
  order: "asc" | "desc" = "asc"
) {
  const direction = order === "asc" ? asc : desc
  const artistSortNameOrderValue = sql`lower(coalesce(${artists.sortName}, ${artists.name}, ''))`
  const artistNameOrderValue = sql`lower(coalesce(${artists.name}, ''))`
  const orderBy =
    orderByField === "trackCount"
      ? [
          direction(artists.trackCount),
          direction(artistSortNameOrderValue),
          direction(artistNameOrderValue),
        ]
      : orderByField === "dateAdded"
        ? [
            direction(artists.createdAt),
            direction(artistSortNameOrderValue),
            direction(artistNameOrderValue),
          ]
        : [direction(artistSortNameOrderValue), direction(artistNameOrderValue)]

  const results = await db.query.artists.findMany({
    where: gt(artists.trackCount, 0),
    columns: {
      id: true,
      name: true,
      sortName: true,
      artwork: true,
      createdAt: true,
      trackCount: true,
    },
    orderBy,
  })

  return results.map((artist) => ({
    id: artist.id,
    name: artist.name,
    sortName: artist.sortName,
    artwork: artist.artwork,
    createdAt: artist.createdAt,
    trackCount: artist.trackCount || 0,
  }))
}

export async function getArtistByName(name: string) {
  const normalizedName = normalizeLookup(name)
  if (!normalizedName) {
    return null
  }

  return db.query.artists.findFirst({
    where: and(
      gt(artists.trackCount, 0),
      eq(sql`lower(coalesce(${artists.name}, ''))`, normalizedName)
    ),
    columns: {
      id: true,
      name: true,
      artwork: true,
      createdAt: true,
      trackCount: true,
    },
  })
}

export async function getArtistById(id: string) {
  return db.query.artists.findFirst({
    where: and(eq(artists.id, id), gt(artists.trackCount, 0)),
    with: {
      albums: {
        where: gt(albums.trackCount, 0),
        orderBy: [desc(albums.year)],
      },
      tracks: {
        where: eq(tracks.isDeleted, 0),
        with: {
          artist: true,
          featuredArtists: {
            with: {
              artist: true,
            },
          },
          album: {
            with: {
              artist: true,
            },
          },
          genres: {
            with: {
              genre: true,
            },
          },
        },
      },
    },
  })
}

export async function listAlbums(
  orderByField: "title" | "artist" | "year" | "trackCount" | "dateAdded" = "title",
  order: "asc" | "desc" = "asc"
) {
  const direction = order === "asc" ? asc : desc
  const albumTitleOrderValue = sql`lower(coalesce(${albums.title}, ''))`
  const orderBy =
    orderByField === "year"
      ? [direction(albums.year), direction(albumTitleOrderValue)]
      : orderByField === "trackCount"
        ? [direction(albums.trackCount), direction(albumTitleOrderValue)]
        : orderByField === "dateAdded"
          ? [direction(albums.createdAt), direction(albumTitleOrderValue)]
          : [direction(albumTitleOrderValue)]

  const results = await db.query.albums.findMany({
    where: gt(albums.trackCount, 0),
    columns: {
      id: true,
      title: true,
      artistId: true,
      year: true,
      artwork: true,
      createdAt: true,
      trackCount: true,
    },
    with: {
      artist: true,
    },
    orderBy: orderByField === "artist" ? undefined : orderBy,
  })

  const dominantArtworkByAlbumId = await getDominantAlbumArtworkMap(
    results.map((album) => album.id)
  )

  const mapped = results.map((album) => ({
    id: album.id,
    title: album.title,
    artistId: album.artistId,
    year: album.year,
    artwork: dominantArtworkByAlbumId.get(album.id) || album.artwork,
    createdAt: album.createdAt,
    artist: album.artist,
    trackCount: album.trackCount || 0,
  }))

  if (orderByField !== "artist") {
    return mapped
  }

  const multiplier = order === "asc" ? 1 : -1
  return mapped.sort((a, b) => {
    const aVal = a.artist?.sortName || a.artist?.name || ""
    const bVal = b.artist?.sortName || b.artist?.name || ""
    const byArtist = aVal.localeCompare(bVal, undefined, {
      sensitivity: "base",
    })

    if (byArtist !== 0) {
      return byArtist * multiplier
    }

    return (
      (a.title || "").localeCompare(b.title || "", undefined, {
        sensitivity: "base",
      }) * multiplier
    )
  })
}

export async function getAlbumById(id: string) {
  const album = await db.query.albums.findFirst({
    where: and(eq(albums.id, id), gt(albums.trackCount, 0)),
    with: {
      artist: true,
      tracks: {
        where: eq(tracks.isDeleted, 0),
        orderBy: [
          asc(tracks.discNumber),
          asc(tracks.trackNumber),
          asc(sql`lower(coalesce(${tracks.title}, ''))`),
        ],
        with: {
          artist: true,
          featuredArtists: {
            with: {
              artist: true,
            },
          },
          genres: {
            with: {
              genre: true,
            },
          },
        },
      },
    },
  })

  if (!album) {
    return null
  }

  const dominantArtwork = selectDominantArtwork(
    album.tracks.map((track) => ({
      artwork: track.artwork,
      dateAdded: track.dateAdded,
    }))
  )

  return {
    ...album,
    artwork: dominantArtwork || album.artwork,
  }
}

export async function getTracksByAlbumName(albumName: string): Promise<Track[]> {
  const normalizedAlbumName = normalizeLookup(albumName)
  const matchingAlbums = await db.query.albums.findMany({
    columns: {
      id: true,
      title: true,
    },
  })

  const matchingAlbumIds = matchingAlbums
    .filter((album) => normalizeLookup(album.title) === normalizedAlbumName)
    .map((album) => album.id)

  if (matchingAlbumIds.length === 0) {
    const fallbackTracks = await db.query.tracks.findMany({
      where: eq(tracks.isDeleted, 0),
      with: {
        artist: true,
        featuredArtists: {
          with: {
            artist: true,
          },
        },
        album: {
          with: {
            artist: true,
          },
        },
        genres: {
          with: {
            genre: true,
          },
        },
      },
      orderBy: [
        asc(tracks.discNumber),
        asc(tracks.trackNumber),
        asc(sql`lower(coalesce(${tracks.title}, ''))`),
      ],
    })

    return fallbackTracks
      .filter((track) => normalizeLookup(track.album?.title) === normalizedAlbumName)
      .map(transformDBTrackToTrack)
  }

  const results = await db.query.tracks.findMany({
    where: and(eq(tracks.isDeleted, 0), inArray(tracks.albumId, matchingAlbumIds)),
    with: {
      artist: true,
      featuredArtists: {
        with: {
          artist: true,
        },
      },
      album: {
        with: {
          artist: true,
        },
      },
      genres: {
        with: {
          genre: true,
        },
      },
    },
    orderBy: [
      asc(tracks.discNumber),
      asc(tracks.trackNumber),
      asc(sql`lower(coalesce(${tracks.title}, ''))`),
    ],
  })

  return results.map(transformDBTrackToTrack)
}

export async function getTracksByArtistName(artistName: string): Promise<Track[]> {
  const normalizedArtistName = normalizeLookup(artistName)
  const matchingArtists = await db.query.artists.findMany({
    columns: {
      id: true,
      name: true,
    },
  })

  const matchingArtistIds = matchingArtists
    .filter((artist) => normalizeLookup(artist.name) === normalizedArtistName)
    .map((artist) => artist.id)

  if (matchingArtistIds.length === 0) {
    const fallbackTracks = await db.query.tracks.findMany({
      where: eq(tracks.isDeleted, 0),
      with: {
        artist: true,
        featuredArtists: {
          with: {
            artist: true,
          },
        },
        album: {
          with: {
            artist: true,
          },
        },
        genres: {
          with: {
            genre: true,
          },
        },
      },
      orderBy: [asc(sql`lower(coalesce(${tracks.title}, ''))`)],
    })

    return fallbackTracks
      .filter(
        (track) =>
          normalizeLookup(track.artist?.name) === normalizedArtistName ||
          track.featuredArtists?.some(
            (entry) => normalizeLookup(entry.artist?.name) === normalizedArtistName
          )
      )
      .map(transformDBTrackToTrack)
  }

  const results = await db.query.tracks.findMany({
    where: and(
      eq(tracks.isDeleted, 0),
      or(
        inArray(tracks.artistId, matchingArtistIds),
        sql`${tracks.id} IN (
          SELECT ${trackArtists.trackId}
          FROM ${trackArtists}
          WHERE ${trackArtists.artistId} IN (${sql.join(
            matchingArtistIds.map((id) => sql`${id}`),
            sql`, `
          )})
        )`
      )
    ),
    with: {
      artist: true,
      featuredArtists: {
        with: {
          artist: true,
        },
      },
      album: {
        with: {
          artist: true,
        },
      },
      genres: {
        with: {
          genre: true,
        },
      },
    },
  })

  return results.map(transformDBTrackToTrack)
}

export async function searchLibrary(query: string): Promise<SearchResults> {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return {
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
    }
  }

  const searchTerm = `%${normalizedQuery}%`
  const emptyResults: SearchResults = {
    tracks: [],
    artists: [],
    albums: [],
    playlists: [],
  }

  try {
    const featuredArtistTrackMatchIds = db
      .select({ trackId: trackArtists.trackId })
      .from(trackArtists)
      .innerJoin(artists, eq(artists.id, trackArtists.artistId))
      .where(like(artists.name, searchTerm))

    const [artistResults, albumResults, playlistResults, titleTrackResults] = await Promise.all([
      db.query.artists.findMany({
        where: and(like(artists.name, searchTerm), gt(artists.trackCount, 0)),
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
        where: and(like(albums.title, searchTerm), gt(albums.trackCount, 0)),
        with: { artist: true },
        orderBy: [asc(sql`lower(coalesce(${albums.title}, ''))`)],
        limit: 10,
      }),
      db.query.playlists.findMany({
        where: like(playlists.name, searchTerm),
        orderBy: [desc(playlists.updatedAt)],
        limit: 10,
        with: {
          tracks: {
            limit: 4,
            orderBy: [asc(playlistTracks.position)],
            with: {
              track: {
                with: {
                  album: true,
                },
              },
            },
          },
        },
      }),
      db.query.tracks.findMany({
        where: and(
          eq(tracks.isDeleted, 0),
          or(like(tracks.title, searchTerm), inArray(tracks.id, featuredArtistTrackMatchIds))
        ),
        with: {
          artist: true,
          featuredArtists: {
            with: {
              artist: true,
            },
          },
          album: {
            with: {
              artist: true,
            },
          },
          genres: {
            with: {
              genre: true,
            },
          },
        },
        orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
        limit: 20,
      }),
    ])

    const matchedArtistIds = artistResults.map((artist) => artist.id)
    const matchedAlbumIds = albumResults.map((album) => album.id)

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

    const relationTrackResults = relationTrackFilter
      ? await db.query.tracks.findMany({
          where: and(eq(tracks.isDeleted, 0), relationTrackFilter),
          with: {
            artist: true,
            featuredArtists: {
              with: {
                artist: true,
              },
            },
            album: {
              with: {
                artist: true,
              },
            },
            genres: {
              with: {
                genre: true,
              },
            },
          },
          orderBy: [desc(tracks.playCount), desc(tracks.lastPlayedAt)],
          limit: 40,
        })
      : []

    const mergedTrackResults = [...titleTrackResults]
    const trackIds = new Set(titleTrackResults.map((track) => track.id))

    for (const track of relationTrackResults) {
      if (trackIds.has(track.id)) {
        continue
      }

      trackIds.add(track.id)
      mergedTrackResults.push(track)

      if (mergedTrackResults.length >= 20) {
        break
      }
    }

    return {
      tracks: mergedTrackResults.map(transformDBTrackToTrack),
      artists: artistResults.map((artist) => ({
        id: artist.id,
        name: artist.name,
        type: "Artist",
        followerCount: 0,
        isVerified: false,
        trackCount: artist.trackCount ?? 0,
        image: artist.artwork || undefined,
      })),
      albums: albumResults.map((album) => ({
        id: album.id,
        title: album.title,
        artist: album.artist?.name || "Unknown Artist",
        isVerified: false,
        image: album.artwork || undefined,
      })),
      playlists: playlistResults.map((playlist) => ({
        id: playlist.id,
        title: playlist.name,
        trackCount: playlist.trackCount || 0,
        image: playlist.artwork || undefined,
        images: collectPlaylistImages(playlist),
      })),
    }
  } catch (error) {
    logError("Search query failed", error, { query: normalizedQuery })
    return emptyResults
  }
}

export async function getRecentSearches() {
  const existing = await readRecentSearches()
  const hydrated = await hydrateRecentSearches(existing)

  const changed =
    existing.length !== hydrated.length ||
    existing.some((item, index) => !areRecentSearchItemsEqual(item, hydrated[index]!))

  if (changed) {
    await writeRecentSearches(hydrated)
  }

  return hydrated
}

export async function addRecentSearch(input: AddRecentSearchInput): Promise<RecentSearchEntry[]> {
  const query = normalizeRecentSearchQuery(input.query)
  if (!query) {
    return readRecentSearches()
  }

  const now = Date.now()
  const title = normalizeRecentSearchQuery(input.title) || query
  const subtitle = normalizeRecentSearchQuery(input.subtitle) || "Search"
  const targetId = normalizeRecentSearchQuery(input.targetId) || undefined
  const image = normalizeRecentSearchQuery(input.image) || undefined
  const images = Array.isArray(input.images)
    ? input.images
        .map((candidate) => normalizeRecentSearchQuery(candidate))
        .filter((candidate): candidate is string => Boolean(candidate))
    : undefined
  const existing = await readRecentSearches()
  const dedupeKey = getRecentSearchDedupeKey({
    type: input.type,
    targetId,
    query,
  })
  const existingMatch = existing.find((item) => getRecentSearchDedupeKey(item) === dedupeKey)

  const nextItem: RecentSearchEntry = {
    id: existingMatch?.id || createRecentSearchId(),
    query,
    title,
    subtitle,
    type: input.type,
    targetId,
    image,
    images,
    createdAt: now,
  }

  const nextItems = [
    nextItem,
    ...existing.filter((item) => getRecentSearchDedupeKey(item) !== dedupeKey),
  ].slice(0, MAX_RECENT_SEARCHES)

  await writeRecentSearches(nextItems)
  return nextItems
}

export async function deleteRecentSearch(id: string): Promise<RecentSearchEntry[]> {
  const normalizedId = normalizeRecentSearchQuery(id)
  if (!normalizedId) {
    return readRecentSearches()
  }

  const existing = await readRecentSearches()
  const nextItems = existing.filter((item) => item.id !== normalizedId)

  if (nextItems.length === 0) {
    await clearRecentSearches()
    return []
  }

  await writeRecentSearches(nextItems)
  return nextItems
}

export async function clearRecentSearches() {
  await db.delete(appSettings).where(eq(appSettings.key, RECENT_SEARCHES_SETTINGS_KEY))
}
