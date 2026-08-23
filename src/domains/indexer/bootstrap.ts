import * as MediaLibrary from "expo-media-library/legacy"

import { getPreferenceState } from "@/core/preferences/store"
import { logError, logInfo } from "@/core/log/service"
import { runAutoBackupCheck } from "@/domains/backup/auto-backup"

export async function canStartIndexingNow(
  options?: { initialScanOnly?: boolean }
): Promise<boolean> {
  if (!getPreferenceState().completedOnboarding) {
    return false
  }

  const indexerScanConfig = getPreferenceState().indexerScanConfig
  if (!indexerScanConfig.autoScanEnabled) {
    return false
  }

  if (options?.initialScanOnly && !indexerScanConfig.initialScanEnabled) {
    return false
  }

  try {
    const permission = await MediaLibrary.getPermissionsAsync()
    if (permission.granted) {
      return true
    }

    if (!permission.canAskAgain) {
      return false
    }

    const requested = await MediaLibrary.requestPermissionsAsync()
    return requested.status === "granted"
  } catch (error) {
    logError("Failed to resolve media library permission for auto scan", error)
    return false
  }
}

export function scheduleStartupWork(work: () => void) {
  const timer = setTimeout(() => {
    void work()
  }, 4000)
  return () => clearTimeout(timer)
}

export function startPostStartupWork() {
  scheduleStartupWork(() => {
    void runAutoBackupCheck()
  })

  scheduleStartupWork(() => {
    void canStartIndexingNow()
      .then((allowed) => {
        if (allowed) {
          return import("./service").then(({ startIndexing }) => startIndexing(false, true))
        }
        return undefined
      })
      .catch((error) => logError("Startup scan failed", error))
      .then(() => logInfo("Post-startup work dispatched"))
  })
}
