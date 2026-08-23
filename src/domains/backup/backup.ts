import { File, Paths } from "expo-file-system"

import { db } from "@/core/db"
import { playHistory } from "@/core/db/schema"
import { preferenceStore } from "@/core/preferences/store"
import type { FolderFilterConfig } from "@/core/preferences/types"
import { normalizePath } from "@/domains/indexer/scan/folder-filter"
import { startIndexing } from "@/domains/indexer/service"

const BACKUP_VERSION = 1

export interface BackupData {
  version: number
  timestamp: string
  preferences: Record<string, unknown>
  playHistory: Array<{
    id: string
    trackId: string
    playedAt: number
    duration: number | null
    completed: number | null
  }>
}

function getBackupPreferences(): Record<string, unknown> {
  const state = preferenceStore.getState() as unknown as Record<string, unknown>
  return {
    themeMode: state.themeMode,
    themeId: state.themeId,
    language: state.language,
    libraryTabsConfig: state.libraryTabsConfig,
    folderFilterConfig: state.folderFilterConfig,
    indexerScanConfig: state.indexerScanConfig,
    indexerNotificationsEnabled: state.indexerNotificationsEnabled,
    appUpdateConfig: state.appUpdateConfig,
    autoBackupConfig: state.autoBackupConfig,
    crossfadeConfig: state.crossfadeConfig,
    audioPlaybackConfig: state.audioPlaybackConfig,
    trackDurationFilterConfig: state.trackDurationFilterConfig,
    countAsPlayedConfig: state.countAsPlayedConfig,
    splitMultipleValueConfig: state.splitMultipleValueConfig,
    loggingLevel: state.loggingLevel,
  }
}

async function exportPlayHistory(): Promise<BackupData["playHistory"]> {
  return db.select().from(playHistory).all()
}

export async function createBackupData(): Promise<BackupData> {
  return {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    preferences: getBackupPreferences(),
    playHistory: await exportPlayHistory(),
  }
}

export async function backupToFile(targetDirectoryUri?: string | null): Promise<string> {
  const backupData = await createBackupData()
  const fileName = `startune-backup-${Date.now()}.json`
  const { Directory } = await import("expo-file-system")

  const file = targetDirectoryUri
    ? new Directory(targetDirectoryUri).createFile(fileName, "application/json")
    : new File(Paths.cache, fileName)

  await file.write(JSON.stringify(backupData, null, 2), { encoding: "utf8" })
  return file.uri
}

export function isBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== "object") {
    return false
  }

  const data = value as Partial<BackupData>
  return data.version === BACKUP_VERSION && typeof data.preferences === "object" && data.preferences !== null
}

function restorePreferenceSlice(key: string, value: unknown) {
  const current = preferenceStore.getState()
  switch (key) {
    case "folderFilterConfig": {
      const source = (value ?? {}) as Partial<FolderFilterConfig>
      const whitelist = Array.from(
        new Set((source.whitelist ?? []).map(normalizePath).filter(Boolean))
      )
      const blacklist = Array.from(
        new Set(
          (source.blacklist ?? [])
            .map(normalizePath)
            .filter((path) => path.length > 0 && !whitelist.includes(path))
        )
      )
      return { folderFilterConfig: { whitelist, blacklist } as FolderFilterConfig }
    }
    default:
      return null
  }
}

export async function restoreFromBackup(data: BackupData): Promise<number> {
  const updates: Partial<Record<string, unknown>> = {}

  for (const [key, value] of Object.entries(data.preferences)) {
    const slice = restorePreferenceSlice(key, value)
    if (slice) {
      Object.assign(updates, slice)
      continue
    }

    const current = preferenceStore.getState() as unknown as Record<string, unknown>
    if (key in current) {
      updates[key] = value
    }
  }

  preferenceStore.setState(updates)

  let restoredCount = 0
  if (Array.isArray(data.playHistory)) {
    const rows = data.playHistory.filter(
      (entry): entry is BackupData["playHistory"][number] =>
        !!entry && typeof entry.id === "string" && typeof entry.trackId === "string"
    )

    for (let i = 0; i < rows.length; i += 100) {
      await db
        .insert(playHistory)
        .values(rows.slice(i, i + 100))
        .onConflictDoNothing()
    }
    restoredCount = rows.length
  }

  return restoredCount
}

export async function parseBackupFile(uri: string): Promise<BackupData | null> {
  try {
    const file = new File(uri)
    if (!file.exists) return null

    const content = await file.text()
    const parsed = JSON.parse(content)
    return isBackupData(parsed) ? parsed : null
  } catch {
    return null
  }
}
