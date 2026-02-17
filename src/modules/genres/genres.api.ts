import { asc, desc, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { tracks } from "@/db/schema"
import type { Track } from "@/modules/player/player.types"
import { transformDBTrackToTrack } from "@/utils/transformers"

import { GENRE_COLORS, GENRE_SHAPES, type GenreShape } from "./genres.constants"

export interface GenreAlbumInfo {
  name: string
  artist?: string
  image?: string
  trackCount: number
  year?: number
}

export interface GenreVisual {
  name: string
  color: string
  shape: GenreShape
}

export async function getAllGenres(): Promise<string[]> {
  try {
    const result = await db.query.genres.findMany({
      orderBy: (genres, { asc }) => [asc(genres.name)],
      columns: {
        name: true,
      },
    })

    return result.map((g) => g.name)
  } catch {
    return []
  }
}

export async function getAllGenreVisuals(): Promise<GenreVisual[]> {
  try {
    const result = await db.query.genres.findMany({
      orderBy: (genres, { asc }) => [asc(genres.name)],
      columns: {
        name: true,
        color: true,
        shape: true,
      },
    })

    return result.map((genre) => ({
      name: genre.name,
      color: genre.color,
      shape: genre.shape as GenreShape,
    }))
  } catch {
    const names = await getAllGenres()
    return names.map((name) => {
      const hash = hashString(name)
      return {
        name,
        color: GENRE_COLORS[hash % GENRE_COLORS.length],
        shape:
          GENRE_SHAPES[
            Math.floor(hash / GENRE_COLORS.length) % GENRE_SHAPES.length
          ],
      }
    })
  }
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export async function getTopTracksByGenre(
  genre: string,
  limit = 25
): Promise<Track[]> {
  try {
    const trimmedGenre = genre.trim()

    const matchingGenres = await db.query.genres.findMany({
      where: (g, { sql }) => sql`${g.name} LIKE ${trimmedGenre}`,
      columns: { id: true },
    })

    if (matchingGenres.length === 0) return []
    const genreIds = matchingGenres.map((g) => g.id)

    const loadedTracks = await db.query.tracks.findMany({
      where: (t, { and, eq }) =>
        and(
          eq(t.isDeleted, 0),
          sql`${t.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(
            genreIds.map((id) => sql`${id}`),
            sql`, `
          )}))`
        ),
      with: {
        artist: true,
        album: true,
      },
      orderBy: [
        desc(tracks.playCount),
        desc(tracks.lastPlayedAt),
        asc(tracks.title),
      ],
      limit,
    })

    return loadedTracks.map(transformDBTrackToTrack)
  } catch {
    return []
  }
}

export async function getAllTracksByGenre(genre: string): Promise<Track[]> {
  try {
    const trimmedGenre = genre.trim()
    const matchingGenres = await db.query.genres.findMany({
      where: (g, { sql }) => sql`${g.name} LIKE ${trimmedGenre}`,
      columns: { id: true },
    })

    if (matchingGenres.length === 0) return []
    const genreIds = matchingGenres.map((g) => g.id)

    const loadedTracks = await db.query.tracks.findMany({
      where: (t, { and, eq }) =>
        and(
          eq(t.isDeleted, 0),
          sql`${t.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(
            genreIds.map((id) => sql`${id}`),
            sql`, `
          )}))`
        ),
      with: {
        artist: true,
        album: true,
      },
      orderBy: [
        desc(tracks.playCount),
        desc(tracks.lastPlayedAt),
        asc(tracks.title),
      ],
    })

    return loadedTracks.map(transformDBTrackToTrack)
  } catch {
    return []
  }
}

export async function getAlbumsByGenre(
  genre: string
): Promise<GenreAlbumInfo[]> {
  try {
    const trimmedGenre = genre.trim()
    const matchingGenres = await db.query.genres.findMany({
      where: (g, { sql }) => sql`LOWER(${g.name}) LIKE LOWER(${trimmedGenre})`,
      columns: { id: true },
    })

    if (matchingGenres.length === 0) return []
    const genreIds = matchingGenres.map((g) => g.id)

    const tracksInGenre = await db.query.tracks.findMany({
      where: (t, { and, eq }) =>
        and(
          eq(t.isDeleted, 0),
          sql`${t.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(
            genreIds.map((id) => sql`${id}`),
            sql`, `
          )}))`,
          sql`${t.albumId} IS NOT NULL`
        ),
      with: {
        album: true,
        artist: true,
      },
    })

    const albumMap = new Map<string, GenreAlbumInfo>()

    for (const track of tracksInGenre) {
      if (track.albumId && track.album) {
        const albumName = track.album.title || "Unknown Album"
        const key = `${albumName}-${track.album.artistId || ""}`

        if (!albumMap.has(key)) {
          albumMap.set(key, {
            name: albumName,
            artist: track.artist?.name || undefined,
            image: track.album.artwork || track.artwork || undefined,
            trackCount: 0,
            year: track.album.year || track.year || undefined,
          })
        }

        albumMap.get(key)!.trackCount++
      }
    }

    return Array.from(albumMap.values()).sort(
      (a, b) => b.trackCount - a.trackCount
    )
  } catch {
    return []
  }
}
