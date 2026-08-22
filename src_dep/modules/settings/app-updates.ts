/**
 * Purpose: Loads, sanitizes, and persists app update notification and preview-release settings.
 * Caller: Update checker runtime and advanced/notification settings screens.
 * Dependencies: Settings repository, settings store, and installed app version metadata.
 * Main Functions: ensureAppUpdateConfigLoaded(), setAppUpdateConfig()
 * Side Effects: Reads and writes `app-updates.json` in Expo document storage and mutates settings state.
 */

import type { AppUpdateConfig } from "@/modules/settings/types"
import { createSettingsModule } from "@/modules/settings/factory"
import { getDefaultAppUpdateConfig } from "@/modules/settings/store"
import { getCurrentAppVersion, isPreviewReleaseVersion } from "@/modules/updates/app-version"

function sanitizeConfig(config: unknown): AppUpdateConfig {
  const fallback = getDefaultAppUpdateConfig()
  const defaultIncludePrereleases = isPreviewReleaseVersion(getCurrentAppVersion())
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}

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
      typeof source.lastNotifiedVersion === "string" ? source.lastNotifiedVersion : undefined,
  }
}

const mod = createSettingsModule<AppUpdateConfig>({
  fileName: "app-updates.json",
  stateKey: "appUpdateConfig",
  getDefault: getDefaultAppUpdateConfig,
  sanitize: sanitizeConfig,
})

export const ensureAppUpdateConfigLoaded = mod.ensureLoaded
export const setAppUpdateConfig = mod.set
