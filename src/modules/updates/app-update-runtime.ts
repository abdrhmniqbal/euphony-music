/**
 * Purpose: Runs the first-open app update check and opens the shared update prompt.
 * Caller: Root layout after bootstrap completes.
 * Dependencies: App update service, settings persistence, update prompt store, logging.
 * Main Functions: checkStartupAppUpdate(), openLatestAppUpdatePrompt()
 * Side Effects: Fetches GitHub releases, schedules notifications, mutates prompt state.
 */

import { ensureAppUpdateConfigLoaded } from "@/modules/settings/app-updates"
import {
  checkForAppUpdate,
  getCurrentAppVersion,
  notifyAppUpdateAvailable,
} from "@/modules/updates/app-update-service"
import { openAppUpdatePrompt } from "@/modules/updates/app-update-store"

let startupCheckPromise: Promise<void> | null = null

export function checkStartupAppUpdate() {
  if (startupCheckPromise) {
    return startupCheckPromise
  }

  startupCheckPromise = (async () => {
    const settings = await ensureAppUpdateConfigLoaded()
    if (!settings.notificationsEnabled) {
      return
    }

    const update = await checkForAppUpdate({
      currentVersion: getCurrentAppVersion(),
      settings,
      skipWhenNotificationsDisabled: true,
    })

    if (!update) {
      return
    }

    openAppUpdatePrompt(update)
    await notifyAppUpdateAvailable(update, settings)
  })().finally(() => {
    startupCheckPromise = null
  })

  return startupCheckPromise
}

export async function openLatestAppUpdatePrompt() {
  const settings = await ensureAppUpdateConfigLoaded()
  const update = await checkForAppUpdate({
    currentVersion: getCurrentAppVersion(),
    settings,
  })

  if (update) {
    openAppUpdatePrompt(update)
  }
}
