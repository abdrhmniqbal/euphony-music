/**
 * Purpose: Resolves device and shared file URIs into playable app-accessible file paths.
 * Caller: player external intent playback, metadata/indexer helpers, and device file opener.
 * Dependencies: Android actual-path resolver, Expo FileSystem legacy copy APIs, logging service.
 * Main Functions: resolvePlayableFileUri(), getContainingFolderUri()
 * Side Effects: Copies unresolved shared content URIs into the app cache for native playback access.
 */

import { Directory, File, Paths } from "expo-file-system"
import { getActualPath } from "@missingcore/react-native-actual-path"

import { logWarn } from "@/modules/logging/service"

import { getExtension, hashUri, toFileUri } from "./file-path-helpers"
export { getContainingFolderUri } from "./file-path-helpers"

const EXTERNAL_AUDIO_CACHE_FOLDER = "external-audio"

async function copyContentUriToCache(uri: string): Promise<string | null> {
  const cacheDir = new Directory(Paths.cache, EXTERNAL_AUDIO_CACHE_FOLDER)
  const cacheFile = new File(cacheDir, `${hashUri(uri)}${getExtension(uri)}`)

  try {
    if (!cacheDir.exists) {
      cacheDir.create({ intermediates: true })
    }

    if (cacheFile.exists) {
      cacheFile.delete()
    }

    await new File(uri).copy(cacheFile)
    return cacheFile.uri
  } catch (error) {
    logWarn("Failed to copy content URI into playback cache", {
      uri,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function resolvePlayableFileUri(uri: string): Promise<string> {
  if (!uri) {
    return ""
  }

  if (uri.startsWith("content://")) {
    try {
      const actualPath = await getActualPath(uri)
      if (actualPath) {
        return toFileUri(actualPath)
      }
    } catch (error) {
      logWarn("Failed to resolve actual path for content URI", {
        uri,
        error: error instanceof Error ? error.message : String(error),
      })
    }
    return (await copyContentUriToCache(uri)) ?? uri
  }

  if (uri.includes("://")) {
    return uri
  }

  return toFileUri(uri)
}
