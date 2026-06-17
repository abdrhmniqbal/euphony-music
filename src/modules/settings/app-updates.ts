/**
 * Purpose: Loads, sanitizes, and persists app update notification and preview-release settings.
 * Caller: Update checker runtime and advanced/notification settings screens.
 * Dependencies: Settings repository, settings store, and installed app version metadata.
 * Main Functions: ensureAppUpdateConfigLoaded(), setAppUpdateConfig()
 * Side Effects: Reads and writes `app-updates.json` in Expo document storage and mutates settings state.
 */

import type { AppUpdateConfig } from "@/modules/settings/types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultAppUpdateConfig,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"
import {
  getCurrentAppVersion,
  isPreviewReleaseVersion,
} from "@/modules/updates/app-version"

const APP_UPDATES_FILE = createSettingsConfigFile("app-updates.json")

let loadPromise: Promise<AppUpdateConfig> | null = null
let hasLoadedConfig = false

function sanitizeConfig(config: unknown): AppUpdateConfig {
  const fallback = getDefaultAppUpdateConfig()
  const defaultIncludePrereleases = isPreviewReleaseVersion(
    getCurrentAppVersion()
  )
  const source =
    config && typeof config === "object"
      ? (config as Record<string, unknown>)
      : {}

  return {
    notificationsEnabled:
      typeof source.notificationsEnabled === "boolean"
        ? source.notificationsEnabled
        : fallback.notificationsEnabled,
    includePrereleases:
      typeof source.includePrereleases === "boolean"
        ? source.includePrereleases
        : defaultIncludePrereleases || fallback.includePrereleases,
    lastNotifiedVersion:
      typeof source.lastNotifiedVersion === "string"
        ? source.lastNotifiedVersion
        : undefined,
  }
}

export async function ensureAppUpdateConfigLoaded(): Promise<AppUpdateConfig> {
  if (hasLoadedConfig) {
    return getSettingsState().appUpdateConfig
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadSettingsConfig(
      APP_UPDATES_FILE,
      getDefaultAppUpdateConfig(),
      sanitizeConfig
    )

    updateSettingsState({ appUpdateConfig: config })
    hasLoadedConfig = true
    return config
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setAppUpdateConfig(
  updates: Partial<AppUpdateConfig>
): Promise<AppUpdateConfig> {
  await ensureAppUpdateConfigLoaded()
  const current = getSettingsState().appUpdateConfig
  const next = sanitizeConfig({ ...current, ...updates })
  updateSettingsState({ appUpdateConfig: next })
  hasLoadedConfig = true
  await saveSettingsConfig(APP_UPDATES_FILE, next)
  return next
}
