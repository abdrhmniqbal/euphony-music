/**
 * Purpose: Normalizes extracted audio metadata for indexing.
 * Caller: Indexer repository and split relation rebuild.
 * Dependencies: None.
 * Main Functions: normalizeText(), normalizeMetadata()
 * Side Effects: None.
 */

import { resolveGenreName } from "@/modules/genres/constants"
import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/prefix-normalization"

interface NormalizableMetadata {
  title?: string | null
  artist?: string | null
  artists: string[]
  album?: string | null
  albumArtist?: string | null
  genres: string[]
  rawArtist?: string | null
  rawAlbumArtist?: string | null
  rawGenre?: string | null
  composer?: string | null
  comment?: string | null
  lyrics?: string | null
}

export function normalizeText(value?: string | null): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.replace(/^\uFEFF/, "").trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function stripFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".")
  if (lastDotIndex <= 0) {
    return filename
  }

  return filename.slice(0, lastDotIndex)
}

function extractFallbackTitle(filename: string): string {
  const fromFilename = stripFileExtension(filename).trim()
  if (fromFilename.length > 0) {
    return fromFilename
  }

  return "Unknown Title"
}

function normalizeGenres(genres: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const genre of genres) {
    const normalizedGenre = normalizeText(genre)
    if (!normalizedGenre) {
      continue
    }

    const resolved = resolveGenreName(normalizedGenre)
    const key = resolved.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    normalized.push(resolved)
  }

  return normalized
}

/**
 * Purpose: Normalizes scanner metadata into database-ready values, including album-artist fallback from track artist.
 * Caller: Indexer metadata preparation and external track indexing.
 * Dependencies: Text normalization helpers, fallback title extraction, genre normalization, and malformed lyric cleanup.
 * Main Functions: normalizeMetadata()
 * Side Effects: None.
 */

export function normalizeMetadata<T extends NormalizableMetadata>(
  metadata: T,
  filename: string
): T {
  const normalizedTitle = normalizeText(metadata.title) || extractFallbackTitle(filename)
  const normalizedArtist = normalizeText(metadata.artist)
  const normalizedGenres = normalizeGenres(metadata.genres)
  const normalizedArtists = Array.from(
    new Set(
      metadata.artists
        .map((artist) => normalizeText(artist))
        .filter((artist): artist is string => Boolean(artist))
    )
  )

  if (normalizedArtists.length === 0 && normalizedArtist) {
    normalizedArtists.push(normalizedArtist)
  }

  return {
    ...metadata,
    title: normalizedTitle,
    artist: normalizedArtist,
    artists: normalizedArtists,
    album: normalizeText(metadata.album),
    albumArtist: normalizeText(metadata.albumArtist) || normalizedArtist,
    genres: normalizedGenres,
    rawArtist: normalizeText(metadata.rawArtist),
    rawAlbumArtist: normalizeText(metadata.rawAlbumArtist),
    rawGenre: normalizeText(metadata.rawGenre),
    composer: normalizeText(metadata.composer),
    comment: normalizeText(metadata.comment),
    lyrics: normalizeText(
      metadata.lyrics ? stripMalformedUtf16LyricsPrefix(metadata.lyrics) : undefined
    ),
  } as T
}
