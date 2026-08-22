/**
 * Purpose: Pure file-URI helpers — file-URI coercion, stable content hashing, extension parsing, and folder extraction.
 * Caller: Path resolver (resolvePlayableFileUri) and external intent playback helpers.
 * Dependencies: none.
 * Main Functions: toFileUri(), hashUri(), getExtension(), getContainingFolderUri()
 * Side Effects: None.
 */

const DEFAULT_AUDIO_EXTENSION = ".audio"

export function toFileUri(path: string): string {
  return path.startsWith("file://") ? path : `file://${path}`
}

export function hashUri(uri: string): string {
  let hash = 5381

  for (let index = 0; index < uri.length; index += 1) {
    hash = (hash * 33) ^ uri.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

export function getExtension(uri: string): string {
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
