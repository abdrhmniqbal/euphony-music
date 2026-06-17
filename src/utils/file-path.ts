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

const EXTERNAL_AUDIO_CACHE_FOLDER = "external-audio"
const DEFAULT_AUDIO_EXTENSION = ".audio"

function toFileUri(path: string): string {
  return path.startsWith("file://") ? path : `file://${path}`
}

function hashUri(uri: string): string {
  let hash = 5381

  for (let index = 0; index < uri.length; index += 1) {
    hash = (hash * 33) ^ uri.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function getExtension(uri: string): string {
  let decodedUri = uri
  try {
    decodedUri = decodeURIComponent(uri)
  } catch {
    decodedUri = uri
  }

  const pathWithoutQuery = decodedUri.split(/[?#]/)[0] ?? decodedUri
  const filename = pathWithoutQuery.split("/").filter(Boolean).at(-1) ?? ""
  const extensionMatch = filename.match(/\.[a-z0-9]{2,5}$/i)

  return extensionMatch?.[0]?.toLowerCase() ?? DEFAULT_AUDIO_EXTENSION
}

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

export function getContainingFolderUri(uri: string): string | null {
  if (!uri.startsWith("file://")) {
    return null
  }

  const lastSlash = uri.lastIndexOf("/")
  if (lastSlash <= "file://".length) {
    return null
  }

  return uri.slice(0, lastSlash)
}
