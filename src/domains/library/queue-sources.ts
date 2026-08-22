import { and, asc, eq, inArray, like } from "drizzle-orm"

import { db } from "@/core/db"
import {
  artists,
  genres,
  playlistTracks,
  playlists,
  trackArtists,
  trackGenres,
  tracks,
} from "@/core/db/schema"

import type { PlayFromSource } from "@/playback/types"
import { FavoritesPlaylistKey } from "./media-constants"

/**
 * Queue-source resolution: track id lists (in playback order) and display names
 * for every playable collection type. Ordering here defines queue order.
 */

export async function getAlbumTrackIds(albumId: string): Promise<string[]> {
  const rows = await db.query.tracks.findMany({
    where: eq(tracks.albumId, albumId),
    orderBy: [asc(tracks.trackNumber), asc(tracks.title)],
    columns: { id: true },
  })
  return rows.map((r) => r.id)
}

export async function getArtistTrackIds(artistName: string): Promise<string[]> {
  const rels = await db
    .select({ trackId: trackArtists.trackId })
    .from(trackArtists)
    .innerJoin(artists, eq(trackArtists.artistId, artists.id))
    .where(eq(artists.name, artistName))

  const ids = rels.map((r) => r.trackId)
  if (ids.length === 0) return []

  const rows = await db.query.tracks.findMany({
    where: and(inArray(tracks.id, ids), eq(tracks.isDeleted, 0)),
    orderBy: [asc(tracks.title)],
    columns: { id: true },
  })
  return rows.map((r) => r.id)
}

export async function getGenreTrackIds(genreName: string): Promise<string[]> {
  const rels = await db
    .select({ trackId: trackGenres.trackId })
    .from(trackGenres)
    .innerJoin(genres, eq(trackGenres.genreId, genres.id))
    .where(eq(genres.name, genreName))

  const ids = rels.map((r) => r.trackId)
  if (ids.length === 0) return []

  const rows = await db.query.tracks.findMany({
    where: and(inArray(tracks.id, ids), eq(tracks.isDeleted, 0)),
    orderBy: [asc(tracks.title)],
    columns: { id: true },
  })
  return rows.map((r) => r.id)
}

export async function getFolderTrackIds(folderPath: string): Promise<string[]> {
  const prefix = `${folderPath}/`
  const rows = await db.query.tracks.findMany({
    where: and(eq(tracks.isDeleted, 0), like(tracks.uri, `${prefix}%`)),
    columns: { id: true, uri: true },
  })

  return rows.filter((row) => !row.uri.slice(prefix.length).includes("/")).map((r) => r.id)
}

export async function getPlaylistTrackIds(playlistNameOrId: string): Promise<string[]> {
  const playlist = await db.query.playlists.findFirst({
    where: eq(playlists.id, playlistNameOrId),
    columns: { id: true },
  })
  if (!playlist) return []

  const rels = await db
    .select({ trackId: playlistTracks.trackId })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlist.id))
    .orderBy(asc(playlistTracks.position))

  return rels.map((r) => r.trackId)
}

export async function getFavoriteTrackIds(): Promise<string[]> {
  const rows = await db.query.tracks.findMany({
    where: and(eq(tracks.isDeleted, 0), eq(tracks.isFavorite, 1)),
    orderBy: [asc(tracks.title)],
    columns: { id: true },
  })
  return rows.map((r) => r.id)
}

export async function getQueueSourceTrackIds(source: PlayFromSource): Promise<string[]> {
  switch (source.type) {
    case "album":
      return getAlbumTrackIds(source.id)
    case "artist":
      return getArtistTrackIds(source.id)
    case "genre":
      return getGenreTrackIds(source.id)
    case "folder":
      return getFolderTrackIds(source.id)
    case "playlist":
      return source.id === FavoritesPlaylistKey
        ? getFavoriteTrackIds()
        : getPlaylistTrackIds(source.id)
    case "mix":
      // Mixes arrive in the collections phase; an empty queue beats a crash.
      return []
    default:
      return []
  }
}
