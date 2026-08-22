import { eq } from "drizzle-orm"
import { Directory, File, Paths, File as ExpoFile } from "expo-file-system"

import { db } from "@/core/db"
import { artworkCache } from "@/core/db/schema"

const ARTWORK_DIR_NAME = "artwork"
const ARTWORK_FILE_EXTENSION = "jpg"

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
