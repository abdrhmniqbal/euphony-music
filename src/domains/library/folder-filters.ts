import { preferenceStore } from "@/core/preferences/store"
import type { FolderFilterConfig } from "@/core/preferences/types"
import { normalizePath } from "@/domains/indexer/scan/folder-filter"

export type { FolderFilterMode } from "./types"

export function normalizeFolderPath(path: string): string {
  return normalizePath(path)
}

function sanitizeConfig(config: FolderFilterConfig): FolderFilterConfig {
  const whitelist = Array.from(new Set(config.whitelist.map(normalizePath).filter(Boolean)))
  const blacklist = Array.from(
    new Set(
      config.blacklist
        .map(normalizePath)
        .filter((path) => path.length > 0 && !whitelist.includes(path))
    )
  )

  return { whitelist, blacklist }
}

export async function commitFolderFilterConfig(config: FolderFilterConfig): Promise<void> {
  const sanitized = sanitizeConfig(config)
  preferenceStore.setState({ folderFilterConfig: sanitized })
}
