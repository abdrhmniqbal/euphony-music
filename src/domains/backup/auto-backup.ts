import { Directory, File } from "expo-file-system"

import { preferenceStore } from "@/core/preferences/store"
import type { AutoBackupConfig } from "@/core/preferences/types"
import { logError } from "@/core/log/service"
import { backupToFile } from "./backup"

export function getDefaultAutoBackupConfig(): AutoBackupConfig {
  return {
    enabled: false,
    intervalHours: 24,
    lastBackupAt: 0,
    targetDirectoryUri: null,
  }
}

export async function runAutoBackupCheck(force = false): Promise<boolean> {
  const config = preferenceStore.getState().autoBackupConfig
  if (!config.enabled && !force) return false
  if (!config.targetDirectoryUri) return false

  const now = Date.now()
  const intervalMs = config.intervalHours * 60 * 60 * 1000
  if (!force && now - config.lastBackupAt < intervalMs) {
    return false
  }

  try {
    const tempUri = await backupToFile()
    const content = await new File(tempUri).text()

    const targetDir = new Directory(config.targetDirectoryUri)
    const createdFile = targetDir.createFile(`autobackup-${now}.json`, "application/json")
    await createdFile.write(content, { encoding: "utf8" })

    preferenceStore.setState({
      autoBackupConfig: { ...config, lastBackupAt: now },
    })
    return true
  } catch (error) {
    logError("auto backup failed", error)
    return false
  }
}
