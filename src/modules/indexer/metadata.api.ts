import {
  getArtwork,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever"
import { eq } from "drizzle-orm"
import { Directory, File, Paths } from "expo-file-system"

import { db } from "@/db/client"
import { artworkCache } from "@/db/schema"

export interface ExtractedMetadata {
  title: string
  artist?: string
  artists: string[]
  album?: string
  albumArtist?: string
  genres: string[]
  year?: number
  trackNumber?: number
  discNumber?: number
  duration: number
  composer?: string
  comment?: string
  lyrics?: string
  artwork?: string
}

const ARTWORK_DIR_NAME = "artwork"

// Define the fields we want to extract
const metadataFields = [
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

export async function extractMetadata(
  uri: string,
  filename: string,
  duration: number
): Promise<ExtractedMetadata> {
  try {
    // Get metadata from the file
    const metadata = await getMetadata(uri, metadataFields)

    // Get artwork separately
    const artwork = await getArtwork(uri).catch(() => null)

    return {
      title: metadata.title || cleanFilename(filename),
      artist: metadata.artist || undefined,
      artists: metadata.artist ? parseMultiValue(metadata.artist) : [],
      album: metadata.albumTitle || undefined,
      albumArtist: metadata.albumArtist || metadata.artist || undefined,
      genres: metadata.genre ? parseMultiValue(metadata.genre) : [],
      year: metadata.year || undefined,
      trackNumber: metadata.trackNumber || undefined,
      discNumber: metadata.discNumber || undefined,
      duration,
      composer: metadata.composer || undefined,
      comment: metadata.description || undefined,
      lyrics: undefined,
      artwork: artwork || undefined,
    }
  } catch {
    return {
      title: cleanFilename(filename),
      artists: [],
      genres: [],
      duration,
    }
  }
}

export async function saveArtworkToCache(
  artworkData: string | undefined
): Promise<string | undefined> {
  if (!artworkData) return undefined

  try {
    // If already a file path, return as-is
    if (artworkData.startsWith("file://") || artworkData.startsWith("/")) {
      return artworkData
    }

    // Generate hash from artwork data
    const hash = generateArtworkHash(artworkData)

    // Check if already cached
    const existing = await db.query.artworkCache.findFirst({
      where: eq(artworkCache.hash, hash),
    })

    if (existing) {
      const existingFile = new File(existing.path)
      if (existingFile.exists) {
        return existing.path
      }
    }

    // Save to cache directory
    const cacheDir = new Directory(Paths.cache, ARTWORK_DIR_NAME)
    if (!cacheDir.exists) {
      cacheDir.create({ intermediates: true, idempotent: true })
    }

    const artworkFile = new File(cacheDir, `${hash}.jpg`)
    if (!artworkFile.exists) {
      artworkFile.create({ intermediates: true, overwrite: true })
    }

    // Remove data URI prefix if present
    let base64Data = artworkData
    if (artworkData.startsWith("data:")) {
      base64Data = artworkData.split(",")[1] || ""
    }

    if (!base64Data) return undefined

    artworkFile.write(base64Data, {
      encoding: "base64",
    })

    // Save to database
    await db.insert(artworkCache).values({
      hash,
      path: artworkFile.uri,
      mimeType: "image/jpeg",
      source: "embedded",
      createdAt: Date.now(),
    })

    return artworkFile.uri
  } catch {
    return undefined
  }
}

// Parse multi-value fields (semicolon or slash delimited)
function parseMultiValue(value: string | null): string[] {
  if (!value) return []
  return value
    .split(/[;/]/)
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

function cleanFilename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
}

function generateArtworkHash(data: string): string {
  const sample = data.slice(0, 1024)
  let hash = 0
  for (let i = 0; i < sample.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i)
    hash |= 0
  }
  return `${Math.abs(hash).toString(16)}_${data.length}`
}
