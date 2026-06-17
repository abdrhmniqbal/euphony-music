/**
 * Purpose: Resolves lyrics from nearby sidecar files or embedded track metadata with in-memory caching.
 * Caller: Player lyrics view.
 * Dependencies: expo-file-system File API and TextDecoder.
 * Main Functions: resolveTrackLyricsSource()
 * Side Effects: Reads sidecar lyric files from device storage.
 */

import { File } from "expo-file-system"
import { extractEmbeddedLyrics } from "@/modules/indexer/metadata"
import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/prefix-normalization"
import { measurePerfTrace } from "@/modules/logging/perf-trace"

interface TrackLyricsSourceInput {
  fileHash?: string
  id?: string
  scanTime?: number
  uri?: string
  lyrics?: string
}

interface SidecarCacheEntry {
  modificationTime: number | null
  lyrics?: string
}

const sidecarLyricsCache = new Map<string, SidecarCacheEntry>()
const resolvedLyricsSourceCache = new Map<string, string | undefined>()

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

function normalizeLyricsText(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined
  }

  const normalized = stripMalformedUtf16LyricsPrefix(raw).trim()

  return normalized.length > 0 ? normalized : undefined
}

function getLyricsTextSignature(value: string | undefined) {
  if (!value) {
    return "none"
  }

  return `${value.length}:${value.slice(0, 32)}:${value.slice(-32)}`
}

function getResolvedLyricsCacheKey(track: TrackLyricsSourceInput) {
  return [
    track.id ?? "",
    track.uri?.trim() ?? "",
    track.fileHash ?? "",
    track.scanTime ?? 0,
    getLyricsTextSignature(track.lyrics),
  ].join("|")
}

async function readSidecarLyrics(candidateUri: string): Promise<string | undefined> {
  try {
    const sidecarFile = new File(candidateUri)
    const info = sidecarFile.info()
    if (!info.exists) {
      sidecarLyricsCache.delete(candidateUri)
      return undefined
    }

    const cached = sidecarLyricsCache.get(candidateUri)
    const modificationTime = info.modificationTime ?? null

    if (cached && cached.modificationTime === modificationTime) {
      return cached.lyrics
    }

    const bytes = await sidecarFile.bytes()
    const decoded = decodeLyricsBytes(bytes)
    const normalized = normalizeLyricsText(decoded)

    sidecarLyricsCache.set(candidateUri, {
      modificationTime,
      lyrics: normalized,
    })

    return normalized
  } catch {
    return undefined
  }
}

export async function resolveTrackLyricsSource(
  track: TrackLyricsSourceInput | null | undefined
): Promise<string | undefined> {
  if (!track) {
    return undefined
  }

  const cacheKey = getResolvedLyricsCacheKey(track)
  if (resolvedLyricsSourceCache.has(cacheKey)) {
    return resolvedLyricsSourceCache.get(cacheKey)
  }

  const uri = track.uri?.trim()
  return await measurePerfTrace(
    "lyrics.resolveTrackLyricsSource",
    async () => {
      if (uri) {
        const sidecarCandidates = getSidecarCandidates(uri)
        for (const candidate of sidecarCandidates) {
          const lyricsFromFile = await readSidecarLyrics(candidate)
          if (lyricsFromFile) {
            resolvedLyricsSourceCache.set(cacheKey, lyricsFromFile)
            return lyricsFromFile
          }
        }

        const lyricsFromMetadata = normalizeLyricsText(await extractEmbeddedLyrics(uri))
        if (lyricsFromMetadata) {
          resolvedLyricsSourceCache.set(cacheKey, lyricsFromMetadata)
          return lyricsFromMetadata
        }
      }

      const embeddedLyrics = normalizeLyricsText(track.lyrics)
      resolvedLyricsSourceCache.set(cacheKey, embeddedLyrics)
      return embeddedLyrics
    },
    {
      trackId: track.id,
      hasEmbeddedLyrics: Boolean(track.lyrics),
      hasUri: Boolean(uri),
    }
  )
}
