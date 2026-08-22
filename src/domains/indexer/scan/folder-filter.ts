import type { FolderFilterConfig } from "@/core/preferences/types"

function convertContentUriToFilePath(uri: string): string | null {
  if (!uri.startsWith("content://")) {
    return null
  }

  const treeMatch = uri.match(/\/tree\/([^/?#]+)/)
  const documentMatch = uri.match(/\/document\/([^/?#]+)/)
  const encodedDocumentId = treeMatch?.[1] ?? documentMatch?.[1]

  if (!encodedDocumentId) {
    return null
  }

  let documentId = ""
  try {
    documentId = decodeURIComponent(encodedDocumentId)
  } catch {
    return null
  }

  const separatorIndex = documentId.indexOf(":")
  if (separatorIndex < 0) {
    return null
  }

  const volume = documentId.slice(0, separatorIndex)
  const relativePath = documentId.slice(separatorIndex + 1).replace(/^\/+/, "")
  const basePath = volume.toLowerCase() === "primary" ? "/storage/emulated/0" : `/storage/${volume}`

  return relativePath ? `${basePath}/${relativePath}` : basePath
}

export function normalizePath(path: string): string {
  if (path.startsWith("content://")) {
    const converted = convertContentUriToFilePath(path)
    if (!converted) {
      return ""
    }
    path = converted
  }
  return path.replace(/^file:\/\//, "").replace(/\/+$/, "")
}

function isSameOrChildPath(path: string, parentPath: string): boolean {
  if (path === parentPath) {
    return true
  }

  return path.startsWith(`${parentPath}/`)
}

export function getFolderPathFromUri(uri: string): string {
  const normalized = normalizePath(uri)
  const lastSlash = normalized.lastIndexOf("/")
  if (lastSlash <= 0) {
    return ""
  }

  return normalized.slice(0, lastSlash)
}

export function isAssetAllowedByFolderFilters(
  assetUri: string,
  config: FolderFilterConfig
): boolean {
  const folderPath = getFolderPathFromUri(assetUri)
  if (!folderPath) {
    return true
  }

  const hasWhitelist = config.whitelist.length > 0
  const inWhitelist = config.whitelist.some((allowedPath) =>
    isSameOrChildPath(folderPath, allowedPath)
  )
  const inBlacklist = config.blacklist.some((blockedPath) =>
    isSameOrChildPath(folderPath, blockedPath)
  )

  if (hasWhitelist && !inWhitelist) {
    return false
  }

  if (inBlacklist) {
    return false
  }

  return true
}
