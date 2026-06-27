/**
 * Purpose: Resolves device and shared file URIs into playable app-accessible file paths.
 * Caller: player external intent playback, metadata/indexer helpers, and device file opener.
 * Dependencies: Android actual-path resolver, Expo FileSystem legacy copy APIs, logging service.
 * Main Functions: resolvePlayableFileUri(), getContainingFolderUri()
 * Side Effects: Copies unresolved shared content URIs into the app cache for native playback access.
 */

import { getActualPath } from "@missingcore/react-native-actual-path"
import * as FileSystem from "expo-file-system/legacy"

import { logWarn } from "@/modules/logging/service"

import { getExtension, hashUri, toFileUri } from "./file-path-helpers"
export { getContainingFolderUri } from "./file-path-helpers"

const EXTERNAL_AUDIO_CACHE_FOLDER = "external-audio"

async function copyContentUriToCache(uri: string): Promise<string | null> {
  if (!FileSystem.cacheDirectory) {
    return null
  }

  const cacheDirectory = `${FileSystem.cacheDirectory}${EXTERNAL_AUDIO_CACHE_FOLDER}/`
  const cacheUri = `${cacheDirectory}${hashUri(uri)}${getExtension(uri)}`

  try {
    const existingDirectory = await FileSystem.getInfoAsync(cacheDirectory)
    if (!existingDirectory.exists) {
      await FileSystem.makeDirectoryAsync(cacheDirectory, {
        intermediates: true,
      })
    }

    const existingFile = await FileSystem.getInfoAsync(cacheUri)
    if (existingFile.exists) {
      await FileSystem.deleteAsync(cacheUri, { idempotent: true })
    }

    await FileSystem.copyAsync({
      from: uri,
      to: cacheUri,
    })

    return cacheUri
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
