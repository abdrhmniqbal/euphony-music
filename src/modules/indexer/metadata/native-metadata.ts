import { File } from "expo-file-system"
import { getArtwork, getLyric, getMetadata } from "@missingcore/react-native-metadata-retriever"
import { extractId3Lyrics } from "./id3-lyrics"
import { extractMp4Lyrics } from "./mp4-lyrics"
import type { SplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"
import { splitArtistsValue, splitGenresValue } from "@/modules/settings/split-multiple-values"

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
  const sanitizedNativeLyrics = nativeLyrics ? nativeLyrics.trim() : null
  if (sanitizedNativeLyrics) {
    return sanitizedNativeLyrics
  }

  return undefined
}

function getSidecarCandidates(uri: string): string[] {
  const sanitizedUri = uri.split("#")[0]?.split("?")[0] || uri
  const lastSlashIndex = sanitizedUri.lastIndexOf("/")
  const lastDotIndex = sanitizedUri.lastIndexOf(".")

  if (lastDotIndex <= lastSlashIndex) {
    return []
  }

  const basePath = sanitizedUri.slice(0, lastDotIndex)
  return [
    `${basePath}.ttml`,
    `${basePath}.TTML`,
    `${basePath}.xml`,
    `${basePath}.XML`,
    `${basePath}.lrc`,
    `${basePath}.LRC`,
  ]
}

function decodeUtf16Be(bytes: Uint8Array): string {
  const swapped = bytes.slice()
  for (let i = 0; i < swapped.length - 1; i += 2) {
    const current = swapped[i]
    swapped[i] = swapped[i + 1] || 0
    swapped[i + 1] = current || 0
  }
  return new TextDecoder("utf-16le").decode(swapped)
}

function decodeLyricsBytes(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return ""
  }

  try {
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return new TextDecoder("utf-8").decode(bytes.slice(3))
    }

    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder("utf-16le").decode(bytes.slice(2))
    }

    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return decodeUtf16Be(bytes.slice(2))
    }

    return new TextDecoder("utf-8").decode(bytes)
  } catch {
    return ""
  }
}

async function readSidecarLyrics(candidateUri: string): Promise<string | undefined> {
  try {
    const sidecarFile = new File(candidateUri)
    if (!sidecarFile.exists) {
      return undefined
    }

    const bytes = await sidecarFile.bytes()
    const decoded = decodeLyricsBytes(bytes)
    const normalized = decoded ? decoded.trim() : undefined
    return normalized && normalized.length > 0 ? normalized : undefined
  } catch {
    return undefined
  }
}

export async function extractMetadata(
  uri: string,
  filename: string,
  durationSeconds: number,
  splitConfig: SplitMultipleValueConfig
): Promise<ExtractedMetadata> {
  const metadata = await getMetadata(uri, metadataFields).catch(() => null)

  const artwork = (await getArtwork(uri).catch(() => null)) || undefined

  let lyrics: string | undefined = undefined
  const sidecarCandidates = getSidecarCandidates(uri)
  for (const candidate of sidecarCandidates) {
    const lyricsFromFile = await readSidecarLyrics(candidate)
    if (lyricsFromFile) {
      lyrics = lyricsFromFile
      break
    }
  }

  if (!lyrics) {
    lyrics = await extractEmbeddedLyrics(uri).catch(() => undefined)
  }

  const bitrate = metadata?.bitrate ? Math.round(Number(metadata.bitrate) / 1000) : undefined
  const sampleRate = metadata?.sampleRate ? Number(metadata.sampleRate) : undefined
  const codec = metadata?.codecs || undefined
  const format = metadata?.sampleMimeType || undefined

  const rawArtist = metadata?.artist?.trim()
  const rawAlbumArtist = metadata?.albumArtist?.trim()
  const rawGenre = metadata?.genre?.trim()

  const splitArtists = rawArtist ? splitArtistsValue(rawArtist, splitConfig) : []
  const artist =
    splitConfig.artistSplitMode === "split" ? splitArtists[0] || undefined : rawArtist || undefined
  const albumArtist = rawAlbumArtist || undefined

  const artists = splitConfig.artistSplitMode === "split" ? splitArtists : artist ? [artist] : []
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

  const parts = text.split(/[-/.]/)
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
