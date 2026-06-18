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
import {
  trackHydrationRelationsWithAlbumArtist,
  trackHydrationRelationsWithoutAlbum,
} from "@/db/track-relations"
import { collectPlaylistImages } from "@/modules/playlist/repository"
import { getDominantAlbumArtworkMap, selectDominantArtwork } from "./artwork"

import type { SearchResults } from "./types"

function normalizeLookup(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
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
        with: trackHydrationRelationsWithAlbumArtist,
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
        with: trackHydrationRelationsWithoutAlbum,
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
    where: eq(sql`lower(coalesce(${albums.title}, ''))`, normalizedAlbumName),
    columns: {
      id: true,
    },
  })

  const matchingAlbumIds = matchingAlbums.map((album) => album.id)

  if (matchingAlbumIds.length === 0) {
    return []
  }

  const results = await db.query.tracks.findMany({
    where: and(eq(tracks.isDeleted, 0), inArray(tracks.albumId, matchingAlbumIds)),
    with: trackHydrationRelationsWithAlbumArtist,
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
    where: eq(sql`lower(coalesce(${artists.name}, ''))`, normalizedArtistName),
    columns: {
      id: true,
    },
  })

  const matchingArtistIds = matchingArtists.map((artist) => artist.id)

  if (matchingArtistIds.length === 0) {
    return []
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
    with: trackHydrationRelationsWithAlbumArtist,
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
        with: trackHydrationRelationsWithAlbumArtist,
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
          with: trackHydrationRelationsWithAlbumArtist,
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


function toDataAlbum(row: typeof albums.$inferSelect & { artist?: { name: string } | null }): import("@/modules/library/data-types").Album {
  return {
    id: row.id,
    name: row.title,
    artwork: row.artwork ?? null,
    artists: row.artist?.name ? [row.artist.name] : [],
    isFavorite: row.isFavorite === 1,
    trackCount: row.trackCount ?? 0,
  }
}

export type AlbumDetail = {
  id: string
  name: string
  artwork: string | null
  artists: string[]
  isFavorite: boolean
  trackCount: number
  year: string | null
}

function toDataArtist(row: typeof artists.$inferSelect): import("@/modules/library/data-types").Artist {
  return {
    id: row.id,
    name: row.name,
    artwork: row.artwork ?? null,
    isFavorite: row.isFavorite === 1,
    trackCount: row.trackCount ?? 0,
    albumCount: row.albumCount ?? 0,
  }
}

export async function getAlbum(id: string) {
  const row = await db.query.albums.findFirst({ where: eq(albums.id, id), with: { artist: true } })
  if (!row) throw new Error("err.msg.noAlbums")
  return toDataAlbum(row)
}

export async function getAlbumDetails(id: string): Promise<AlbumDetail> {
  const row = await db.query.albums.findFirst({ where: eq(albums.id, id), with: { artist: true } })
  if (!row) throw new Error("err.msg.noAlbums")
  return { ...toDataAlbum(row), year: null }
}

export async function getAlbumsSummary() {
  const rows = await db.query.albums.findMany({
    with: { artist: true },
    orderBy: asc(sql`lower(coalesce(${albums.title}, ''))`),
  })
  return rows.map(toDataAlbum)
}

export async function getAlbumTracks<TOnlyIds extends boolean | undefined = false>(
  albumId: string,
  onlyIds?: TOnlyIds
) {
  const rows = await db.query.tracks.findMany({
    where: eq(tracks.albumId, albumId),
    orderBy: asc(tracks.trackNumber),
  })
  if (onlyIds) {
    return rows.map((r) => ({ id: r.id })) as TOnlyIds extends true
      ? Array<{ id: string }>
      : typeof rows
  }
  return rows as TOnlyIds extends true ? Array<{ id: string }> : typeof rows
}

export async function getArtist(id: string) {
  const row = await db.query.artists.findFirst({ where: eq(artists.id, id) })
  if (!row) throw new Error("err.msg.noArtists")
  return toDataArtist(row)
}

export async function getArtistsSummary() {
  const rows = await db.query.artists.findMany({
    orderBy: asc(sql`lower(coalesce(${artists.name}, ''))`),
  })
  return rows.map(toDataArtist)
}

export async function getSortedArtistTracks<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds
) {
  const rels = await db
    .select({ trackId: trackArtists.trackId })
    .from(trackArtists)
    .innerJoin(artists, eq(trackArtists.artistId, artists.id))
    .where(eq(artists.name, id))

  const trackIds = rels.map((r) => r.trackId)
  if (trackIds.length === 0) return [] as TOnlyIds extends true ? Array<{ id: string }> : never[]

  if (onlyIds) {
    return trackIds.map((tid) => ({ id: tid })) as TOnlyIds extends true
      ? Array<{ id: string }>
      : never[]
  }

  const rows = await db.query.tracks.findMany({
    where: inArray(tracks.id, trackIds),
    with: { artist: true, album: { with: { artist: true } } },
  })
  return rows as TOnlyIds extends true ? Array<{ id: string }> : typeof rows
}

export async function getFoldersSummary() {
  const rows = await db
    .select({ uri: tracks.uri, count: sql<number>`count(*)` })
    .from(tracks)
    .groupBy(sql`rtrim(${tracks.uri}, replace(${tracks.uri}, '/', ''))`)
    .orderBy(asc(tracks.uri))

  return rows.map((row) => ({
    path: row.uri.split("/").slice(0, -1).join("/"),
    trackCount: row.count,
  }))
}

export async function getSortedFolderTracks<TOnlyIds extends boolean | undefined = false>(
  path: string | null | undefined,
  onlyIds?: TOnlyIds
) {
  if (!path) return [] as TOnlyIds extends true ? Array<{ id: string }> : never[]

  const prefix = `file:///${path}/`
  const rows = await db.query.tracks.findMany({
    where: and(eq(tracks.isDeleted, 0), like(tracks.uri, `${prefix}%`)),
    orderBy: asc(tracks.uri),
  })

  if (onlyIds) {
    return rows.map((r) => ({ id: r.id })) as TOnlyIds extends true
      ? Array<{ id: string }>
      : never[]
  }

  return rows as TOnlyIds extends true ? Array<{ id: string }> : typeof rows
}
