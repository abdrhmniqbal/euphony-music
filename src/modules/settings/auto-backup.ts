/**
 * Purpose: Persists and evaluates auto backup settings.
 * Caller: Auto backup settings screen, runtime check.
 * Dependencies: Settings store.
 */

import { Directory, File } from "expo-file-system"
import { createSettingsModule } from "@/modules/settings/factory"
import type { AutoBackupConfig } from "@/modules/settings/types"
import { backupPreferencesToFile } from "./backup"

export const DEFAULT_AUTO_BACKUP_CONFIG: AutoBackupConfig = {
  enabled: false,
  intervalHours: 24,
  lastBackupAt: 0,
  targetDirectoryUri: null,
}

function sanitizeConfig(config: unknown): AutoBackupConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}
  return {
    enabled:
      typeof source.enabled === "boolean" ? source.enabled : DEFAULT_AUTO_BACKUP_CONFIG.enabled,
    intervalHours:
      typeof source.intervalHours === "number"
        ? source.intervalHours
        : DEFAULT_AUTO_BACKUP_CONFIG.intervalHours,
    lastBackupAt:
      typeof source.lastBackupAt === "number"
        ? source.lastBackupAt
        : DEFAULT_AUTO_BACKUP_CONFIG.lastBackupAt,
    targetDirectoryUri:
      typeof source.targetDirectoryUri === "string"
        ? source.targetDirectoryUri
        : DEFAULT_AUTO_BACKUP_CONFIG.targetDirectoryUri,
  }
}

const mod = createSettingsModule<AutoBackupConfig>({
  fileName: "auto-backup.json",
  stateKey: "autoBackupConfig",
  getDefault: () => DEFAULT_AUTO_BACKUP_CONFIG,
  sanitize: sanitizeConfig,
})

export const ensureAutoBackupConfigLoaded = mod.ensureLoaded
export const setAutoBackupConfig = mod.set

export async function runAutoBackupCheck(force = false): Promise<boolean> {
  const config = await ensureAutoBackupConfigLoaded()
  if (!config.enabled && !force) return false
  if (!config.targetDirectoryUri) return false

  const now = Date.now()
  const intervalMs = config.intervalHours * 60 * 60 * 1000
  if (!force && now - config.lastBackupAt < intervalMs) {
    return false
  }

  try {
    // Generate temp backup JSON
    const tempUri = await backupPreferencesToFile()
    const tempFile = new File(tempUri)
    if (!tempFile.exists) return false
    const content = await tempFile.text()

    // Write to document tree
    const targetDir = new Directory(config.targetDirectoryUri)

    const filename = `autobackup-${now}.json`
    const createdFile = targetDir.createFile(filename, "application/json")
    await createdFile.write(content, { encoding: "utf8" })

    // Save state
    await setAutoBackupConfig({ lastBackupAt: now })
    return true
  } catch (err) {
    console.error("Auto backup failed:", err)
    return false
  }
}
