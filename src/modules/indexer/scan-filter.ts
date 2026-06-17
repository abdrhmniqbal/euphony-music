/**
 * Purpose: Checks whether MediaLibrary assets are eligible for indexing by URI and extension.
 * Caller: Indexer repository scan pipeline.
 * Dependencies: MediaLibrary asset shape.
 * Main Functions: isSupportedAssetByExtension(), isAllowedAssetUri()
 * Side Effects: None.
 */

import type * as MediaLibrary from "expo-media-library/legacy"

const SUPPORTED_EXTENSIONS = new Set([
  "mp3",
  "flac",
  "aac",
  "ogg",
  "m4a",
  "opus",
  "wav",
])
const EXCLUDED_URI_SEGMENTS = ["/android/", "/android/data/", "/android/obb/"]

export function isSupportedAssetByExtension(asset: MediaLibrary.Asset): boolean {
  const filename = (asset.filename || "").toLowerCase()
  const extension = filename.split(".").pop()
  if (!extension) {
    return false
  }

  return SUPPORTED_EXTENSIONS.has(extension)
}

export function isAllowedAssetUri(uri: string): boolean {
  const normalizedUri = uri.toLowerCase()

  if (
    EXCLUDED_URI_SEGMENTS.some((segment) => normalizedUri.includes(segment))
  ) {
    return false
  }

  const pathWithoutScheme = normalizedUri.replace(/^file:\/\//, "")
  const segments = pathWithoutScheme.split("/").filter(Boolean)
  return !segments.some((segment) => segment.startsWith("."))
}
