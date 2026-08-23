import { getPreferenceState, preferenceStore } from "@/core/preferences/store"
import {
  checkForAppUpdate,
  getCurrentAppVersion,
  notifyAppUpdateAvailable,
} from "@/domains/updates/app-update-service"
import { openAppUpdatePrompt } from "@/domains/updates/app-update-store"

let startupCheckPromise: Promise<void> | null = null

export function updateAppUpdateConfig(
  updates: Partial<{ notificationsEnabled: boolean; includePrereleases: boolean; lastNotifiedVersion?: string }>
) {
  const current = preferenceStore.getState().appUpdateConfig
  preferenceStore.setState({ appUpdateConfig: { ...current, ...updates } })
}

export function checkStartupAppUpdate() {
  if (startupCheckPromise) {
    return startupCheckPromise
  }

  startupCheckPromise = (async () => {
    const settings = getPreferenceState().appUpdateConfig
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
  const settings = getPreferenceState().appUpdateConfig
  const update = await checkForAppUpdate({
    currentVersion: getCurrentAppVersion(),
    settings,
  })

  if (update) {
    openAppUpdatePrompt(update)
  }
}
