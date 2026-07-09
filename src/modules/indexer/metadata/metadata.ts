import { eq } from "drizzle-orm"
import { getArtwork, getLyric, getMetadata } from "@missingcore/react-native-metadata-retriever"
import { db } from "@/db/client"
import { artworkCache } from "@/db/schema"
import { Directory, File, Paths, File as ExpoFile } from "expo-file-system"
import {
  splitArtistsValue,
  splitGenresValue,
  type SplitMultipleValueConfig,
} from "@/modules/settings/split-multiple-values"

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

const METADATA_FIELDS = [
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

const ARTWORK_DIR_NAME = "artwork"
const ARTWORK_FILE_EXTENSION = "jpg"

// --- Embedded lyrics extraction --------------------------------------------

export async function extractEmbeddedLyrics(uri: string): Promise<string | undefined> {
  try {
    const file = new ExpoFile(uri)
    if (file.exists) {
      const bytes = await file.bytes()
      const fromFile = extractId3Lyrics(bytes) || extractMp4Lyrics(bytes)
      const sanitized = fromFile?.trim()
      if (sanitized) {
        return sanitized
      }
    }
  } catch {
    // fall through to native retriever
  }

  const nativeLyrics = await getLyric(uri).catch(() => null)
  return nativeLyrics ? nativeLyrics.trim() || undefined : undefined
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
      const swapped = bytes.slice(2)
      for (let i = 0; i < swapped.length - 1; i += 2) {
        const current = swapped[i]
        swapped[i] = swapped[i + 1] || 0
        swapped[i + 1] = current || 0
      }
      return new TextDecoder("utf-16le").decode(swapped)
    }
    return new TextDecoder("utf-8").decode(bytes)
  } catch {
    return ""
  }
}

async function readSidecarLyrics(candidateUri: string): Promise<string | undefined> {
  try {
    const sidecarFile = new ExpoFile(candidateUri)
    if (!sidecarFile.exists) {
      return undefined
    }

    const bytes = await sidecarFile.bytes()
    const decoded = decodeLyricsBytes(bytes).trim()
    return decoded.length > 0 ? decoded : undefined
  } catch {
    return undefined
  }
}

// --- ID3 (MP3) lyrics -------------------------------------------------------

const ID3_HEADER_SIZE = 10
const ID3_FRAME_HEADER_SIZE = 10
const ID3_TIMESTAMP_FORMAT_MILLISECONDS = 2

function hasByteRange(bytes: Uint8Array, offset: number, length: number) {
  return offset >= 0 && length >= 0 && offset + length <= bytes.length
}

function isSyncSafeInteger(bytes: Uint8Array, offset: number) {
  if (!hasByteRange(bytes, offset, 4)) {
    return false
  }
  return (
    ((bytes[offset] || 0) & 0x80) === 0 &&
    ((bytes[offset + 1] || 0) & 0x80) === 0 &&
    ((bytes[offset + 2] || 0) & 0x80) === 0 &&
    ((bytes[offset + 3] || 0) & 0x80) === 0
  )
}

function decodeSyncSafeInteger(bytes: Uint8Array, offset: number) {
  if (!isSyncSafeInteger(bytes, offset)) {
    return 0
  }
  return (
    ((bytes[offset] || 0) << 21) |
    ((bytes[offset + 1] || 0) << 14) |
    ((bytes[offset + 2] || 0) << 7) |
    (bytes[offset + 3] || 0)
  )
}

function decodeInteger(bytes: Uint8Array, offset: number) {
  if (!hasByteRange(bytes, offset, 4)) {
    return 0
  }
  return (
    (((bytes[offset] || 0) << 24) |
      ((bytes[offset + 1] || 0) << 16) |
      ((bytes[offset + 2] || 0) << 8) |
      (bytes[offset + 3] || 0)) >>>
    0
  )
}

function decodeTextValue(bytes: Uint8Array, encoding: number) {
  if (bytes.length === 0) {
    return ""
  }
  try {
    switch (encoding) {
      case 1:
        return new TextDecoder("utf-16").decode(bytes)
      case 2:
        return new TextDecoder("utf-16be").decode(bytes)
      default:
        return new TextDecoder("utf-8").decode(bytes)
    }
  } catch {
    return ""
  }
}

function findEncodedTextTerminator(bytes: Uint8Array, encoding: number) {
  if (encoding === 0 || encoding === 3) {
    return bytes.indexOf(0)
  }
  for (let i = 0; i < bytes.length - 1; i += 1) {
    if (bytes[i] === 0 && bytes[i + 1] === 0) {
      return i
    }
  }
  return -1
}

function formatLrcTimestamp(timeSeconds: number) {
  const safe = Math.max(0, timeSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = Math.floor(safe % 60)
  const centiseconds = Math.floor((safe - Math.floor(safe)) * 100)
  return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}]`
}

function extractId3SyncedLyrics(frameBytes: Uint8Array): string | undefined {
  if (frameBytes.length <= 6) {
    return undefined
  }

  const encoding = frameBytes[0] || 0
  const timestampFormat = frameBytes[4] || 0
  if (timestampFormat !== ID3_TIMESTAMP_FORMAT_MILLISECONDS) {
    return undefined
  }

  const descriptorAndData = frameBytes.slice(6)
  const descriptorEnd = findEncodedTextTerminator(descriptorAndData, encoding)
  if (descriptorEnd < 0) {
    return undefined
  }

  const dataStart = descriptorEnd + (encoding === 0 || encoding === 3 ? 1 : 2)
  const payload = descriptorAndData.slice(dataStart)
  if (payload.length === 0) {
    return undefined
  }

  const lines: Array<{ time: number; text: string }> = []
  let offset = 0
  while (offset < payload.length) {
    const remaining = payload.slice(offset)
    const textEnd = findEncodedTextTerminator(remaining, encoding)
    if (textEnd < 0) {
      break
    }

    const text = decodeTextValue(remaining.slice(0, textEnd), encoding).trim()
    const separatorLength = encoding === 0 || encoding === 3 ? 1 : 2
    const timestampOffset = offset + textEnd + separatorLength
    if (timestampOffset + 4 > payload.length) {
      break
    }

    const timestamp = decodeInteger(payload, timestampOffset) >>> 0
    offset = timestampOffset + 4

    if (text) {
      lines.push({ time: timestamp / 1000, text })
    }
  }

  if (lines.length === 0) {
    return undefined
  }

  return lines
    .sort((a, b) => a.time - b.time)
    .map((line) => `${formatLrcTimestamp(line.time)}${line.text}`)
    .join("\n")
}

export function extractId3Lyrics(bytes: Uint8Array): string | undefined {
  if (
    bytes.length < ID3_HEADER_SIZE ||
    bytes[0] !== 0x49 ||
    bytes[1] !== 0x44 ||
    bytes[2] !== 0x33
  ) {
    return undefined
  }

  const version = bytes[3] || 0
  if (!isSyncSafeInteger(bytes, 6)) {
    return undefined
  }

  const tagSize = decodeSyncSafeInteger(bytes, 6)
  const tagEnd = Math.min(bytes.length, ID3_HEADER_SIZE + tagSize)
  let offset = ID3_HEADER_SIZE

  while (offset + ID3_FRAME_HEADER_SIZE <= tagEnd) {
    const frameId = String.fromCharCode(
      bytes[offset] || 0,
      bytes[offset + 1] || 0,
      bytes[offset + 2] || 0,
      bytes[offset + 3] || 0
    ).replaceAll("\0", "")

    if (!frameId) {
      break
    }

    if (version === 4 && !isSyncSafeInteger(bytes, offset + 4)) {
      break
    }

    const frameSize =
      version === 4
        ? decodeSyncSafeInteger(bytes, offset + 4)
        : decodeInteger(bytes, offset + 4)
    if (frameSize <= 0) {
      break
    }

    const frameStart = offset + ID3_FRAME_HEADER_SIZE
    const frameEnd = Math.min(tagEnd, frameStart + frameSize)
    if (frameEnd <= frameStart) {
      break
    }

    if (frameId === "SYLT") {
      const synced = extractId3SyncedLyrics(bytes.slice(frameStart, frameEnd))
      if (synced) {
        return synced
      }
    }

    if (frameId === "USLT") {
      const encoding = bytes[frameStart] || 0
      const descriptorAndLyrics = bytes.slice(frameStart + 4)
      const descriptorEnd = findEncodedTextTerminator(descriptorAndLyrics, encoding)
      const lyricsStart =
        descriptorEnd >= 0
          ? descriptorEnd + (encoding === 0 || encoding === 3 ? 1 : 2)
          : 0
      const lyrics = decodeTextValue(descriptorAndLyrics.slice(lyricsStart), encoding).trim()
      if (lyrics) {
        return lyrics
      }
    }

    offset = frameEnd
  }

  return undefined
}

// --- MP4 (M4A) lyrics -------------------------------------------------------

function getAtomType(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(
    bytes[offset] || 0,
    bytes[offset + 1] || 0,
    bytes[offset + 2] || 0,
    bytes[offset + 3] || 0
  )
}

function findMp4AtomData(
  bytes: Uint8Array,
  targetType: string,
  start = 0,
  end = bytes.length
): Uint8Array | null {
  let offset = start

  while (offset + 8 <= end) {
    const size = decodeInteger(bytes, offset)
    const type = getAtomType(bytes, offset + 4)
    if (size < 8) {
      break
    }

    const atomEnd = Math.min(end, offset + size)
    const childStart = type === "meta" ? offset + 12 : offset + 8

    if (type === targetType) {
      return bytes.slice(childStart, atomEnd)
    }

    if (type === "moov" || type === "udta" || type === "meta" || type === "ilst") {
      const nested = findMp4AtomData(bytes, targetType, childStart, atomEnd)
      if (nested) {
        return nested
      }
    }

    offset = atomEnd
  }

  return null
}

export function extractMp4Lyrics(bytes: Uint8Array): string | undefined {
  const lyricType = String.fromCharCode(0xa9, 0x6c, 0x79, 0x72)
  const lyricAtom = findMp4AtomData(bytes, lyricType)
  if (!lyricAtom) {
    return undefined
  }

  let offset = 0
  while (offset + 16 <= lyricAtom.length) {
    const childSize = decodeInteger(lyricAtom, offset)
    const childType = getAtomType(lyricAtom, offset + 4)
    if (childSize < 16) {
      break
    }

    const childEnd = Math.min(lyricAtom.length, offset + childSize)
    if (childType === "data") {
      const payload = lyricAtom.slice(offset + 16, childEnd)
      const lyrics = new TextDecoder("utf-8").decode(payload).trim()
      if (lyrics) {
        return lyrics
      }
    }

    offset = childEnd
  }

  return undefined
}

// --- Metadata extraction ----------------------------------------------------

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
    const numeric = Number.parseInt(parts[parts.length - 1].trim(), 10)
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

export async function extractMetadata(
  uri: string,
  filename: string,
  durationSeconds: number,
  splitConfig: SplitMultipleValueConfig
): Promise<ExtractedMetadata> {
  const metadata = await getMetadata(uri, METADATA_FIELDS).catch(() => null)
  const artwork = (await getArtwork(uri).catch(() => null)) || undefined

  let lyrics: string | undefined
  for (const candidate of getSidecarCandidates(uri)) {
    const fromFile = await readSidecarLyrics(candidate)
    if (fromFile) {
      lyrics = fromFile
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
    trackNumber: metadata?.trackNumber
      ? parseInt(String(metadata.trackNumber), 10)
      : undefined,
    discNumber: metadata?.discNumber ? parseInt(String(metadata.discNumber), 10) : undefined,
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

// --- Artwork cache ----------------------------------------------------------

function normalizeArtworkData(data: string) {
  if (data.startsWith("data:")) {
    const separatorIndex = data.indexOf(",")
    if (separatorIndex < 0) {
      return null
    }
    const mimeType = data.slice(0, separatorIndex).match(/^data:([^;]+)/)?.[1] || "image/jpeg"
    const base64Data = data.slice(separatorIndex + 1).trim()
    return base64Data ? { base64Data, mimeType } : null
  }

  const base64Data = data.trim()
  return base64Data ? { base64Data, mimeType: "image/jpeg" } : null
}

function generateArtworkHash(data: string): string {
  let hashA = 5381
  let hashB = 52711

  for (let i = 0; i < data.length; i += 1) {
    const char = data.charCodeAt(i)
    hashA = ((hashA << 5) + hashA) ^ char
    hashB = ((hashB << 5) + hashB) ^ (char + i)
  }

  const partA = (hashA >>> 0).toString(16).padStart(8, "0")
  const partB = (hashB >>> 0).toString(16).padStart(8, "0")
  return `${partA}${partB}_${data.length}`
}

export async function saveArtworkToCache(
  artworkData: string | undefined,
  sourceUrl?: string
): Promise<string | undefined> {
  if (!artworkData) {
    return undefined
  }

  try {
    if (artworkData.startsWith("file://") || artworkData.startsWith("/")) {
      return artworkData
    }

    const cacheDir = new Directory(Paths.cache, ARTWORK_DIR_NAME)
    if (!cacheDir.exists) {
      cacheDir.create({ intermediates: true, idempotent: true })
    }

    if (artworkData.startsWith("http://") || artworkData.startsWith("https://")) {
      const hash = sourceUrl ? generateArtworkHash(sourceUrl) : generateArtworkHash(artworkData)
      const existing = await db.query.artworkCache.findFirst({
        where: eq(artworkCache.hash, hash),
      })
      if (existing && new ExpoFile(existing.path).exists) {
        return existing.path
      }

      const artworkFile = new File(cacheDir, `${hash}.${ARTWORK_FILE_EXTENSION}`)
      await ExpoFile.downloadFileAsync(artworkData, artworkFile)

      await db
        .insert(artworkCache)
        .values({
          hash,
          path: artworkFile.uri,
          mimeType: "image/jpeg",
          source: "remote",
          createdAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: artworkCache.hash,
          set: { path: artworkFile.uri, mimeType: "image/jpeg", source: "remote" },
        })

      return artworkFile.uri
    }

    const normalized = normalizeArtworkData(artworkData)
    if (!normalized) {
      return undefined
    }

    const { base64Data, mimeType } = normalized
    const hash = sourceUrl ? generateArtworkHash(sourceUrl) : generateArtworkHash(base64Data)
    const existing = await db.query.artworkCache.findFirst({
      where: eq(artworkCache.hash, hash),
    })
    if (existing && new ExpoFile(existing.path).exists) {
      return existing.path
    }

    const artworkFile = new File(cacheDir, `${hash}.${ARTWORK_FILE_EXTENSION}`)
    if (!artworkFile.exists) {
      artworkFile.create({ intermediates: true, overwrite: true })
    }
    artworkFile.write(base64Data, { encoding: "base64" })

    await db
      .insert(artworkCache)
      .values({
        hash,
        path: artworkFile.uri,
        mimeType,
        source: sourceUrl ? "remote" : "embedded",
        createdAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: artworkCache.hash,
        set: {
          path: artworkFile.uri,
          mimeType,
          source: sourceUrl ? "remote" : "embedded",
        },
      })

    return artworkFile.uri
  } catch {
    return undefined
  }
}

export async function cleanupUnusedArtworkCache(): Promise<void> {
  const [cachedArtwork, trackRows, albumRows, artistRows, playlistRows] = await Promise.all([
    db.query.artworkCache.findMany({ columns: { hash: true, path: true } }),
    db.query.tracks.findMany({ columns: { artwork: true } }),
    db.query.albums.findMany({ columns: { artwork: true } }),
    db.query.artists.findMany({ columns: { artwork: true } }),
    db.query.playlists.findMany({ columns: { artwork: true } }),
  ])

  const referencedArtworkPaths = new Set(
    [...trackRows, ...albumRows, ...artistRows, ...playlistRows]
      .map((row) => row.artwork)
      .filter((path): path is string => typeof path === "string" && !path.startsWith("http"))
  )

  for (const cached of cachedArtwork) {
    const artworkPath = cached.path
    if (!artworkPath || referencedArtworkPaths.has(artworkPath)) {
      continue
    }
    try {
      const file = new ExpoFile(artworkPath)
      if (file.exists) {
        file.delete()
      }
    } catch {
      // ignore
    }
    await db.delete(artworkCache).where(eq(artworkCache.hash, cached.hash))
  }

  try {
    const cacheDir = new Directory(Paths.cache, ARTWORK_DIR_NAME)
    if (!cacheDir.exists) {
      return
    }
    const cachedFilePaths = new Set(cachedArtwork.map((cached) => cached.path))
    for (const entry of cacheDir.list()) {
      if (!(entry instanceof ExpoFile)) {
        continue
      }
      if (referencedArtworkPaths.has(entry.uri) || cachedFilePaths.has(entry.uri)) {
        continue
      }
      try {
        entry.delete()
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}
