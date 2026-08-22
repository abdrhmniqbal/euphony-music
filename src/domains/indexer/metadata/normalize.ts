import { resolveGenreName } from "@/domains/genres/constants"
import type { ExtractedMetadata } from "./extract"

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
  return fromFilename.length > 0 ? fromFilename : "Unknown Title"
}

function normalizeGenres(genres: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const genre of genres) {
    const normalizedGenre = normalizeText(genre)
    if (!normalizedGenre) continue
    const resolved = resolveGenreName(normalizedGenre)
    const key = resolved.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(resolved)
  }

  return normalized
}

export function normalizeMetadata(
  metadata: ExtractedMetadata,
  filename: string
): ExtractedMetadata {
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
    lyrics: normalizeText(metadata.lyrics),
  }
}
