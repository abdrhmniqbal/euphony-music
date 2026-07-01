import { asc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { genres, trackGenres, tracks } from "@/db/schema"

import { getGenreDbNames, getGenreRainbowColor, getGenreShape, resolveGenreName } from "./constants"
import type { GenreAlbumInfo, GenreVisual } from "./types"

function getFallbackGenreVisual(name: string): GenreVisual {
  return {
    name,
    color: getGenreRainbowColor(name),
    shape: getGenreShape(name),
    trackCount: 0,
  }
}

function normalizeGenreName(name: string | null | undefined): string | null {
  if (typeof name !== "string") {
    return null
  }

  const trimmedName = name.trim()
  return trimmedName.length > 0 ? resolveGenreName(trimmedName) : null
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
        color: getGenreRainbowColor(genre.name),
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
          color: getGenreRainbowColor(genre.name),
          shape: fallback.shape,
          trackCount: genre.trackCount,
        }
      })
    } catch {
      return []
    }
  }
}

export async function getAllTracksByGenre(genre: string): Promise<Track[]> {
  try {
    const dbNames = getGenreDbNames(genre)

    const matchingGenres = await db.query.genres.findMany({
      where: (g, { inArray }) => inArray(g.name, dbNames),
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
    const dbNames = getGenreDbNames(genre)

    const matchingGenres = await db.query.genres.findMany({
      where: (g, { inArray }) => inArray(g.name, dbNames),
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

export async function getSortedGenreTracks<TOnlyIds extends boolean | undefined = false>(
  id: string,
  onlyIds?: TOnlyIds
) {
  const dbNames = getGenreDbNames(id)

  const rels = await db
    .select({ trackId: trackGenres.trackId })
    .from(trackGenres)
    .innerJoin(genres, eq(trackGenres.genreId, genres.id))
    .where(inArray(genres.name, dbNames))

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
