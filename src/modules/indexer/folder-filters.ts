import { atom } from "nanostores"
import { File, Paths } from "expo-file-system"

export type FolderFilterMode = "whitelist" | "blacklist"

export interface FolderFilterConfig {
  whitelist: string[]
  blacklist: string[]
}

const FOLDER_FILTERS_FILE = new File(Paths.document, "folder-filters.json")
const EMPTY_FILTER_CONFIG: FolderFilterConfig = {
  whitelist: [],
  blacklist: [],
}

export const $folderFilterConfig = atom<FolderFilterConfig>(EMPTY_FILTER_CONFIG)

let loadPromise: Promise<FolderFilterConfig> | null = null

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
  const basePath =
    volume.toLowerCase() === "primary"
      ? "/storage/emulated/0"
      : `/storage/${volume}`

  return relativePath ? `${basePath}/${relativePath}` : basePath
}

function normalizePath(path: string): string {
  if (path.startsWith("content://")) {
    const converted = convertContentUriToFilePath(path)
    if (!converted) {
      return ""
    }
    path = converted
  }

  const withoutScheme = path.replace(/^file:\/\//, "")
  const normalizedSlashes = withoutScheme.replace(/\\/g, "/")
  const withoutQuery = normalizedSlashes.split("?")[0].split("#")[0] || ""
  const trimmed = withoutQuery.trim()

  if (!trimmed) {
    return ""
  }

  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1)
  }

  return trimmed
}

function sanitizeConfig(config: FolderFilterConfig): FolderFilterConfig {
  const whitelist = Array.from(
    new Set(config.whitelist.map(normalizePath).filter(Boolean))
  )
  const blacklist = Array.from(
    new Set(
      config.blacklist
        .map(normalizePath)
        .filter((path) => path.length > 0 && !whitelist.includes(path))
    )
  )

  return { whitelist, blacklist }
}

async function persistConfig(config: FolderFilterConfig): Promise<void> {
  if (!FOLDER_FILTERS_FILE.exists) {
    FOLDER_FILTERS_FILE.create({
      intermediates: true,
      overwrite: true,
    })
  }

  FOLDER_FILTERS_FILE.write(JSON.stringify(config), {
    encoding: "utf8",
  })
}

export async function ensureFolderFilterConfigLoaded(): Promise<FolderFilterConfig> {
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    try {
      if (!FOLDER_FILTERS_FILE.exists) {
        $folderFilterConfig.set(EMPTY_FILTER_CONFIG)
        return EMPTY_FILTER_CONFIG
      }

      const raw = await FOLDER_FILTERS_FILE.text()
      const parsed = JSON.parse(raw) as Partial<FolderFilterConfig>
      const next = sanitizeConfig({
        whitelist: parsed.whitelist ?? [],
        blacklist: parsed.blacklist ?? [],
      })
      $folderFilterConfig.set(next)
      return next
    } catch {
      $folderFilterConfig.set(EMPTY_FILTER_CONFIG)
      return EMPTY_FILTER_CONFIG
    }
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setFolderFilterMode(
  path: string,
  mode: FolderFilterMode | null
): Promise<FolderFilterConfig> {
  const normalizedPath = normalizePath(path)
  if (!normalizedPath) {
    return $folderFilterConfig.get()
  }

  await ensureFolderFilterConfigLoaded()
  const current = $folderFilterConfig.get()

  const whitelist = current.whitelist.filter((item) => item !== normalizedPath)
  const blacklist = current.blacklist.filter((item) => item !== normalizedPath)

  if (mode === "whitelist") {
    whitelist.push(normalizedPath)
  } else if (mode === "blacklist") {
    blacklist.push(normalizedPath)
  }

  const next = sanitizeConfig({ whitelist, blacklist })
  $folderFilterConfig.set(next)
  await persistConfig(next)
  return next
}

export async function clearFolderFilters(): Promise<void> {
  $folderFilterConfig.set(EMPTY_FILTER_CONFIG)
  await persistConfig(EMPTY_FILTER_CONFIG)
}

export async function setAllFolderFiltersMode(
  mode: FolderFilterMode
): Promise<FolderFilterConfig> {
  await ensureFolderFilterConfigLoaded()
  const current = $folderFilterConfig.get()
  const folders = Array.from(
    new Set([...current.whitelist, ...current.blacklist])
  )

  const next =
    mode === "whitelist"
      ? sanitizeConfig({ whitelist: folders, blacklist: [] })
      : sanitizeConfig({ whitelist: [], blacklist: folders })

  $folderFilterConfig.set(next)
  await persistConfig(next)
  return next
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

export function getFolderNameFromPath(path: string): string {
  const normalized = normalizePath(path)
  if (!normalized) {
    return ""
  }

  const parts = normalized.split("/").filter(Boolean)
  const segment = parts[parts.length - 1] || normalized
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
