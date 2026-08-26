import { File, Paths } from "expo-file-system"

import { preferenceStore } from "@/core/preferences/store"
import type { FolderFilterConfig, PreferenceState } from "@/core/preferences/types"
import { isNonEmptyString, isRecord, isString } from "@/lib/guards"
import { normalizePath } from "@/domains/indexer/scan/folder-filter"

const BACKUP_VERSION = 1

const PREFERENCE_BACKUP_KEYS = [
  "themeMode",
  "themeId",
  "language",
  "libraryTabsConfig",
  "folderFilterConfig",
  "indexerScanConfig",
  "indexerNotificationsEnabled",
  "appUpdateConfig",
  "autoBackupConfig",
  "crossfadeConfig",
  "audioPlaybackConfig",
  "trackDurationFilterConfig",
  "countAsPlayedConfig",
  "splitMultipleValueConfig",
  "loggingLevel",
] as const

export type BackupPreferences = Pick<PreferenceState, (typeof PREFERENCE_BACKUP_KEYS)[number]>

export type BackupPlayHistoryRow = {
  id: string
  trackId: string
  playedAt: number
  duration: number | null
  completed: number | null
}

export interface BackupData {
  version: number
  timestamp: string
  preferences: Partial<BackupPreferences>
  playHistory: BackupPlayHistoryRow[]
}

export interface PlayHistoryGateway {
  readAll(): BackupPlayHistoryRow[]
  insertIgnoringConflicts(rows: BackupPlayHistoryRow[]): Promise<void>
}

async function loadDrizzlePlayHistoryGateway(): Promise<PlayHistoryGateway> {
  const [{ db }, { playHistory }] = await Promise.all([
    import("@/core/db"),
    import("@/core/db/schema"),
  ])
  return {
    readAll: () => db.select().from(playHistory).all(),
    insertIgnoringConflicts: async (rows) => {
      for (let i = 0; i < rows.length; i += 100) {
        await db
          .insert(playHistory)
          .values(rows.slice(i, i + 100))
          .onConflictDoNothing()
      }
    },
  }
}

function resolveGateway(injected?: PlayHistoryGateway) {
  return injected ?? loadDrizzlePlayHistoryGateway()
}

function getBackupPreferences(): BackupPreferences {
  const state = preferenceStore.getState()
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

export interface BackupOptions {
  includePreferences: boolean
  includeHistory: boolean
}

const DEFAULT_BACKUP_OPTIONS: BackupOptions = {
  includePreferences: true,
  includeHistory: true,
}

export async function createBackupData(
  gateway?: PlayHistoryGateway,
  options: BackupOptions = DEFAULT_BACKUP_OPTIONS
): Promise<BackupData> {
  const history = await resolveGateway(gateway)
  return {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    preferences: options.includePreferences ? getBackupPreferences() : {},
    playHistory: options.includeHistory ? history.readAll() : [],
  }
}

export async function backupToFile(
  targetDirectoryUri?: string | null,
  options: BackupOptions = DEFAULT_BACKUP_OPTIONS
): Promise<string> {
  const backupData = await createBackupData(undefined, options)
  const fileName = `startune-backup-${Date.now()}.json`
  const { Directory } = await import("expo-file-system")

  const file = targetDirectoryUri
    ? new Directory(targetDirectoryUri).createFile(fileName, "application/json")
    : new File(Paths.cache, fileName)

  await file.write(JSON.stringify(backupData, null, 2), { encoding: "utf8" })
  return file.uri
}

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- this function is the trust boundary that validates untrusted backup payloads
export function isBackupData(value: unknown): value is BackupData {
  return isRecord(value) && value.version === BACKUP_VERSION && isRecord(value.preferences)
}

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- sanitizes attacker-controlled folder filters from an untrusted backup payload
function sanitizeFolderFilters(config: unknown): FolderFilterConfig {
  const whitelist = Array.from(
    new Set(
      (isRecord(config) && Array.isArray(config.whitelist) ? config.whitelist : [])
        .filter(isString)
        .map(normalizePath)
        .filter(isNonEmptyString)
    )
  )
  const blacklist = Array.from(
    new Set(
      (isRecord(config) && Array.isArray(config.blacklist) ? config.blacklist : [])
        .filter(isString)
        .map(normalizePath)
        .filter((path) => path.length > 0 && !whitelist.includes(path))
    )
  )
  return { whitelist, blacklist }
}

export async function restoreFromBackup(
  data: BackupData,
  gateway?: PlayHistoryGateway
): Promise<number> {
  const source = data.preferences
  const updates: Partial<BackupPreferences> = {}

  // Explicit per-key whitelist so unknown keys from an untrusted backup file never reach the store
  if (source.themeMode !== undefined) updates.themeMode = source.themeMode
  if (source.themeId !== undefined) updates.themeId = source.themeId
  if (source.language !== undefined) updates.language = source.language
  if (source.libraryTabsConfig !== undefined) updates.libraryTabsConfig = source.libraryTabsConfig
  if (source.folderFilterConfig !== undefined) {
    updates.folderFilterConfig = sanitizeFolderFilters(source.folderFilterConfig)
  }
  if (source.indexerScanConfig !== undefined) updates.indexerScanConfig = source.indexerScanConfig
  if (source.indexerNotificationsEnabled !== undefined) {
    updates.indexerNotificationsEnabled = source.indexerNotificationsEnabled
  }
  if (source.appUpdateConfig !== undefined) updates.appUpdateConfig = source.appUpdateConfig
  if (source.autoBackupConfig !== undefined) updates.autoBackupConfig = source.autoBackupConfig
  if (source.crossfadeConfig !== undefined) updates.crossfadeConfig = source.crossfadeConfig
  if (source.audioPlaybackConfig !== undefined) {
    updates.audioPlaybackConfig = source.audioPlaybackConfig
  }
  if (source.trackDurationFilterConfig !== undefined) {
    updates.trackDurationFilterConfig = source.trackDurationFilterConfig
  }
  if (source.countAsPlayedConfig !== undefined) {
    updates.countAsPlayedConfig = source.countAsPlayedConfig
  }
  if (source.splitMultipleValueConfig !== undefined) {
    updates.splitMultipleValueConfig = source.splitMultipleValueConfig
  }
  if (source.loggingLevel !== undefined) updates.loggingLevel = source.loggingLevel

  preferenceStore.setState(updates)

  const rows = (Array.isArray(data.playHistory) ? data.playHistory : []).filter(
    (entry): entry is BackupPlayHistoryRow =>
      isRecord(entry) && isString(entry.id) && isString(entry.trackId)
  )
  const history = await resolveGateway(gateway)
  await history.insertIgnoringConflicts(rows)

  return rows.length
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
