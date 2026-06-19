import { File } from "expo-file-system"
import { getArtwork, getLyric, getMetadata } from "@missingcore/react-native-metadata-retriever"
import { extractId3Lyrics } from "./id3-lyrics"
import { extractMp4Lyrics } from "./mp4-lyrics"
import type { SplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"
import { splitArtistsValue, splitGenresValue } from "@/modules/settings/split-multiple-values"
import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/prefix-normalization"

export interface ExtractedMetadata {
  title: string
  artist?: string
  artists: string[]
  album?: string
  albumArtist?: string
  genres: string[]
  rawArtist?: string
  rawAlbumArtist?: string
  rawGenre?: string
  year?: number
  trackNumber?: number
  discNumber?: number
  duration: number
  bitrate?: number
  sampleRate?: number
  codec?: string
  format?: string
  composer?: string
  comment?: string
  lyrics?: string
  artwork?: string
}

const metadataFields = [
  "bitrate",
  "sampleRate",
  "codecs",
  "sampleMimeType",
  "title",
  "artist",
  "albumArtist",
  "albumTitle",
  "trackNumber",
  "discNumber",
  "genre",
  "composer",
  "description",
  "year",
  "artworkData",
] as const

export async function extractEmbeddedLyrics(uri: string) {
  try {
    const file = new File(uri)
    if (file.exists) {
      const bytes = await file.bytes()
      const jsLyrics = extractId3Lyrics(bytes) || extractMp4Lyrics(bytes)
      const sanitizedJsLyrics = jsLyrics?.trim()
      if (sanitizedJsLyrics) {
        return sanitizedJsLyrics
      }
    }
  } catch {}

  const nativeLyrics = await getLyric(uri).catch(() => null)
  const sanitizedNativeLyrics = nativeLyrics ? stripMalformedUtf16LyricsPrefix(nativeLyrics).trim() : null
  if (sanitizedNativeLyrics) {
    return sanitizedNativeLyrics
  }

  return undefined
}

export async function extractMetadata(
  uri: string,
  filename: string,
  durationSeconds: number,
  splitConfig: SplitMultipleValueConfig
): Promise<ExtractedMetadata> {
  const metadata = await getMetadata(uri, metadataFields).catch(() => null)
  const artwork = await getArtwork(uri).catch(() => null)
  const lyrics = await extractEmbeddedLyrics(uri).catch(() => undefined)

  const bitrate = metadata?.bitrate
    ? Math.round(Number(metadata.bitrate) / 1000)
    : undefined
  const sampleRate = metadata?.sampleRate
    ? Number(metadata.sampleRate)
    : undefined
  const codec = metadata?.codecs || undefined
  const format = metadata?.sampleMimeType || undefined

  const rawArtist = metadata?.artist?.trim()
  const rawAlbumArtist = metadata?.albumArtist?.trim()
  const rawGenre = metadata?.genre?.trim()

  const artist = rawArtist || undefined
  const albumArtist = rawAlbumArtist || undefined

  const artists = artist ? splitArtistsValue(artist, splitConfig) : []
  const genres = rawGenre ? splitGenresValue(rawGenre, splitConfig) : []

  const trackNumber = metadata?.trackNumber ? parseInt(String(metadata.trackNumber), 10) : undefined
  const discNumber = metadata?.discNumber ? parseInt(String(metadata.discNumber), 10) : undefined

  const title = metadata?.title?.trim() || cleanFilename(filename)
  const album = metadata?.albumTitle?.trim() || undefined
  const composer = metadata?.composer?.trim() || undefined
  const comment = metadata?.description?.trim() || undefined
  const year = parseMetadataYear(metadata?.year)

  return {
    title,
    artist,
    artists,
    album,
    albumArtist,
    genres,
    rawArtist,
    rawAlbumArtist,
    rawGenre,
    year,
    trackNumber,
    discNumber,
    duration: durationSeconds,
    bitrate,
    sampleRate,
    codec,
    format,
    composer,
    comment,
    lyrics,
    artwork: artwork || undefined,
  }
}

function parseMetadataYear(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return normalizeMetadataYear(value)
  }

  const text = String(value || "").trim()
  if (!text) {
    return undefined
  }

  const fourDigitMatch = text.match(/\b(\d{4})\b/)
  if (fourDigitMatch?.[1]) {
    return normalizeMetadataYear(Number.parseInt(fourDigitMatch[1], 10))
  }

  const parts = text.split(/[\/\-\.]/)
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1].trim()
    const numeric = Number.parseInt(lastPart, 10)
    if (!Number.isNaN(numeric)) {
      return normalizeMetadataYear(numeric)
    }
  }

  const twoDigitMatch = text.match(/\b(\d{2})\b/)
  if (twoDigitMatch?.[1]) {
    return normalizeMetadataYear(Number.parseInt(twoDigitMatch[1], 10))
  }

  const rawParsed = Number.parseInt(text, 10)
  if (!Number.isNaN(rawParsed)) {
    return normalizeMetadataYear(rawParsed)
  }

  return undefined
}

function normalizeMetadataYear(value: number): number | undefined {
  if (!Number.isInteger(value) || value <= 0) {
    return undefined
  }

  if (value >= 1000) {
    return value
  }

  if (value < 100) {
    return value >= 70 ? 1900 + value : 2000 + value
  }

  return undefined
}

function cleanFilename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
}
