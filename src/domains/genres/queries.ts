import { eq, inArray } from "drizzle-orm"
import { useQuery } from "@tanstack/react-query"

import { db } from "@/core/db"
import { genres, trackGenres } from "@/core/db/schema"
import { GENRES_KEY } from "@/domains/library/query-keys"
import { getGenreDbNames } from "./constants"

export interface GenreTrackRow {
  id: string
  title: string
  artwork: string | null
  albumArtwork: string | null
  albumId: string | null
  albumTitle: string | null
  artistName: string | null
  rawArtist: string | null
  duration: number
  playCount: number | null
  trackNumber: number | null
  discNumber: number | null
  year: number | null
  dateAdded: number | null
}

export interface GenreAlbum {
  id: string | null
  name: string
  artist: string | null
  image: string | null
  year: number | null
  trackCount: number
}

export interface GenreDetails {
  topTracks: GenreTrackRow[]
  albums: GenreAlbum[]
}

async function getGenreId(genreName: string): Promise<string | null> {
  const candidates = getGenreDbNames(genreName)
  const rows = await db
    .select({ id: genres.id })
    .from(genres)
    .where(inArray(genres.name, candidates))
  return rows[0]?.id ?? null
}

async function getGenreDetails(genreName: string): Promise<GenreDetails> {
  const genreId = await getGenreId(genreName)
  if (!genreId) {
    return { topTracks: [], albums: [] }
  }

  const rels = await db.query.trackGenres.findMany({
    where: eq(trackGenres.genreId, genreId),
    with: {
      track: {
        with: {
          album: { with: { artist: true } },
          artist: true,
        },
      },
    },
  })

  const topTracks: GenreTrackRow[] = []
  for (const rel of rels) {
    const track = rel.track
    if (!track || track.isDeleted) continue
    topTracks.push({
      id: track.id,
      title: track.title,
      artwork: track.artwork,
      albumArtwork: track.album?.artwork ?? null,
      albumId: track.albumId,
      albumTitle: track.album?.title ?? null,
      artistName: track.artist?.name ?? null,
      rawArtist: track.rawArtist,
      duration: track.duration,
      playCount: track.playCount,
      trackNumber: track.trackNumber,
      discNumber: track.discNumber,
      year: track.album?.year ?? null,
      dateAdded: track.dateAdded,
    })
  }
  topTracks.sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))

  const albumMap = new Map<string, GenreAlbum>()
  for (const row of topTracks) {
    if (!row.albumTitle) continue
    const existing = albumMap.get(row.albumTitle)
    if (existing) {
      existing.trackCount += 1
    } else {
      albumMap.set(row.albumTitle, {
        id: row.albumId,
        name: row.albumTitle,
        artist: row.artistName,
        image: row.albumArtwork || row.artwork,
        year: row.year,
        trackCount: 1,
      })
    }
  }

  const albums = Array.from(albumMap.values()).sort((a, b) => b.trackCount - a.trackCount)
  return { topTracks, albums }
}

export function useGenreDetails(genreName: string) {
  const normalized = genreName.trim()

  return useQuery({
    queryKey: [GENRES_KEY, "details", normalized],
    enabled: normalized.length > 0,
    placeholderData: (previousData) => previousData,
    queryFn: () => getGenreDetails(normalized),
  })
}
