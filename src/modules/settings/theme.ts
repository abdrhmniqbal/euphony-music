/**
 * Purpose: Loads, sanitizes, and persists the selected app theme.
 * Caller: Appearance settings, app runtime preload, and root theme wrapper.
 * Dependencies: Settings repository, settings store, and app theme registry.
 * Main Functions: ensureThemeConfigLoaded(), setThemeConfig()
 * Side Effects: Reads and writes `app-theme.json` in Expo document storage and mutates settings state.
 */

import type { ThemeConfig } from "@/modules/settings/types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultThemeConfig,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"
import { isAppThemeId } from "@/modules/ui/theme-registry"

const THEME_FILE = createSettingsConfigFile("app-theme.json")

let loadPromise: Promise<ThemeConfig> | null = null
let hasLoadedConfig = false

function sanitizeConfig(config: unknown): ThemeConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}
  const defaultConfig = getDefaultThemeConfig()
  const themeId = isAppThemeId(source.themeId) ? source.themeId : defaultConfig.themeId

  return { themeId }
}

export async function ensureThemeConfigLoaded(): Promise<ThemeConfig> {
  if (hasLoadedConfig) {
    return getSettingsState().themeConfig
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadSettingsConfig(THEME_FILE, getDefaultThemeConfig(), sanitizeConfig)

    updateSettingsState({ themeConfig: config })
    hasLoadedConfig = true
    return config
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setThemeConfig(updates: Partial<ThemeConfig>): Promise<ThemeConfig> {
  await ensureThemeConfigLoaded()
  const current = getSettingsState().themeConfig
  const next = sanitizeConfig({ ...current, ...updates })
  updateSettingsState({ themeConfig: next })
  hasLoadedConfig = true
  await saveSettingsConfig(THEME_FILE, next)
  return next
}
