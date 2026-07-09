/**
 * Purpose: Builds stable indexer IDs, sort names, hashes, and file fingerprints.
 * Caller: Indexer repository.
 * Dependencies: Expo FileSystem and MediaLibrary asset shape.
 * Main Functions: generateAssetHash(), generateFileHash(), generateSortName(), generateId(), hashString()
 * Side Effects: Reads file metadata when MediaLibrary modification time is missing.
 */

import { File } from "expo-file-system"
import type * as MediaLibrary from "expo-media-library/legacy"

export function generateAssetHash(asset: MediaLibrary.Asset): string {
  const shouldReadFileInfo = asset.modificationTime === undefined || asset.modificationTime === null
  const info = shouldReadFileInfo ? getFileInfo(asset.uri) : null
  const modificationTime =
    info?.modificationTime ?? asset.modificationTime ?? asset.creationTime ?? 0

  const fingerprint = `${asset.uri}|${modificationTime}`
  let hashA = 5381
  let hashB = 52711

  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hashA = ((hashA << 5) + hashA) ^ char
    hashB = ((hashB << 5) + hashB) ^ char
  }

  const partA = (hashA >>> 0).toString(16).padStart(8, "0")
  const partB = (hashB >>> 0).toString(16).padStart(8, "0")
  return `${partA}${partB}`
}

function getFileInfo(uri: string): { size?: number; modificationTime?: number | null } | null {
  try {
    const file = new File(uri)
    return file.info()
  } catch {
    return null
  }
}

export function generateSortName(name: string): string {
  const articles = ["The", "A", "An"]
  for (const article of articles) {
    if (name.startsWith(`${article} `)) {
      return `${name.slice(article.length + 1)}, ${article}`
    }
  }
  return name
}
