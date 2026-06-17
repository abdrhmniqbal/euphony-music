import type { Track } from "@/modules/player/types"

import { asc, desc, eq, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { genres, trackGenres, tracks } from "@/db/schema"
import { transformDBTrackToTrack } from "@/utils/transformers"

import { GENRE_COLORS, GENRE_SHAPES } from "./constants"
import type { GenreAlbumInfo, GenreVisual } from "./types"

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function getFallbackGenreVisual(name: string): GenreVisual {
  const hash = hashString(name)

  return {
    name,
    color: GENRE_COLORS[hash % GENRE_COLORS.length],
    shape: GENRE_SHAPES[Math.floor(hash / GENRE_COLORS.length) % GENRE_SHAPES.length],
    trackCount: 0,
  }
}

function normalizeGenreName(name: string | null | undefined): string | null {
  if (typeof name !== "string") {
    return null
  }

  const trimmedName = name.trim()
  return trimmedName.length > 0 ? trimmedName : null
}

async function listActiveGenreRows() {
  const rows = await db
    .select({
      id: genres.id,
      name: genres.name,
      trackCount: sql<number>`count(${trackGenres.trackId})`.as("trackCount"),
    })
    .from(genres)
    .innerJoin(trackGenres, eq(trackGenres.genreId, genres.id))
    .innerJoin(tracks, eq(trackGenres.trackId, tracks.id))
    .where(eq(tracks.isDeleted, 0))
    .groupBy(genres.id, genres.name)
    .orderBy(sql`lower(coalesce(${genres.name}, ''))`)

  return rows
    .map((row) => {
      const name = normalizeGenreName(row.name)
      if (!name) {
        return null
      }

      return {
        id: row.id,
        name,
        trackCount: Math.max(0, Math.trunc(Number(row.trackCount) || 0)),
      }
    })
    .filter(
      (
        row
      ): row is {
        id: string
        name: string
        trackCount: number
      } => Boolean(row)
    )
}

async function listGenreVisualMetadata() {
  try {
    const rows = await db.query.genres.findMany({
      columns: {
        name: true,
        color: true,
        shape: true,
      },
    })

    const entries = rows
      .map((row) => {
        const name = normalizeGenreName(row.name)
        if (!name) {
          return null
        }

        return [
          name,
          {
            color: row.color,
            shape: row.shape as GenreVisual["shape"],
          },
        ] as const
      })
      .filter((entry): entry is readonly [string, { color: string; shape: GenreVisual["shape"] }] =>
        Boolean(entry)
      )

    return new Map(entries)
  } catch {
    return new Map<string, { color: string; shape: GenreVisual["shape"] }>()
  }
}

export async function getAllGenres(): Promise<string[]> {
  try {
    const rows = await listActiveGenreRows()
    return rows.map((genre) => genre.name)
  } catch {
    return []
  }
}

export async function getAllGenreVisuals(): Promise<GenreVisual[]> {
  try {
    const [activeGenres, visualMetadataByName] = await Promise.all([
      listActiveGenreRows(),
      listGenreVisualMetadata(),
    ])

    return activeGenres.map((genre) => {
      const fallback = getFallbackGenreVisual(genre.name)
      const visuals = visualMetadataByName.get(genre.name)

      return {
        name: genre.name,
        color: visuals?.color || fallback.color,
        shape: visuals?.shape || fallback.shape,
        trackCount: genre.trackCount,
      }
    })
  } catch {
    try {
      const rows = await listActiveGenreRows()

      return rows.map((genre) => {
        const fallback = getFallbackGenreVisual(genre.name)

        return {
          name: genre.name,
          color: fallback.color,
          shape: fallback.shape,
          trackCount: genre.trackCount,
        }
      })
    } catch {
      return []
    }
  }
}

export async function getTopTracksByGenre(genre: string, limit = 25): Promise<Track[]> {
  try {
    const trimmedGenre = genre.trim()

    const matchingGenres = await db.query.genres.findMany({
      where: (g, { sql }) => sql`${g.name} LIKE ${trimmedGenre}`,
      columns: { id: true },
    })

    if (matchingGenres.length === 0) {
      return []
    }

    const genreIds = matchingGenres.map((matchingGenre) => matchingGenre.id)

    const loadedTracks = await db.query.tracks.findMany({
      where: (track, { and, eq }) =>
        and(
          eq(track.isDeleted, 0),
          sql`${track.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(
            genreIds.map((id) => sql`${id}`),
            sql`, `
          )}))`
        ),
      with: {
        artist: true,
        featuredArtists: {
          with: {
            artist: true,
          },
        },
        album: true,
        genres: {
          with: {
            genre: true,
          },
        },
      },
      orderBy: [
        desc(tracks.playCount),
        desc(tracks.lastPlayedAt),
        asc(sql`lower(coalesce(${tracks.title}, ''))`),
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

    if (matchingGenres.length === 0) {
      return []
    }

    const genreIds = matchingGenres.map((matchingGenre) => matchingGenre.id)

    const loadedTracks = await db.query.tracks.findMany({
      where: (track, { and, eq }) =>
        and(
          eq(track.isDeleted, 0),
          sql`${track.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(
            genreIds.map((id) => sql`${id}`),
            sql`, `
          )}))`
        ),
      with: {
        artist: true,
        featuredArtists: {
          with: {
            artist: true,
          },
        },
        album: true,
        genres: {
          with: {
            genre: true,
          },
        },
      },
      orderBy: [
        desc(tracks.playCount),
        desc(tracks.lastPlayedAt),
        asc(sql`lower(coalesce(${tracks.title}, ''))`),
      ],
    })

    return loadedTracks.map(transformDBTrackToTrack)
  } catch {
    return []
  }
}

export async function getAlbumsByGenre(genre: string): Promise<GenreAlbumInfo[]> {
  try {
    const trimmedGenre = genre.trim()

    const matchingGenres = await db.query.genres.findMany({
      where: (g, { sql }) => sql`LOWER(${g.name}) LIKE LOWER(${trimmedGenre})`,
      columns: { id: true },
    })

    if (matchingGenres.length === 0) {
      return []
    }

    const genreIds = matchingGenres.map((matchingGenre) => matchingGenre.id)

    const tracksInGenre = await db.query.tracks.findMany({
      where: (track, { and, eq }) =>
        and(
          eq(track.isDeleted, 0),
          sql`${track.id} IN (SELECT track_id FROM track_genres WHERE genre_id IN (${sql.join(
            genreIds.map((id) => sql`${id}`),
            sql`, `
          )}))`,
          sql`${track.albumId} IS NOT NULL`
        ),
      with: {
        album: true,
        artist: true,
      },
    })

    const albumMap = new Map<string, GenreAlbumInfo>()

    for (const track of tracksInGenre) {
      if (!track.albumId || !track.album) {
        continue
      }

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

    return Array.from(albumMap.values()).sort((a, b) => b.trackCount - a.trackCount)
  } catch {
    return []
  }
}

export async function listGenres() {
  return db.query.genres.findMany({
    orderBy: (genres, { asc }) => [asc(sql`lower(coalesce(${genres.name}, ''))`)],
  })
}

export async function getGenreById(id: string) {
  return db.query.genres.findFirst({
    where: eq(genres.id, id),
    with: {
      tracks: {
        with: {
          track: {
            with: {
              artist: true,
              album: true,
            },
          },
        },
      },
    },
  })
}
