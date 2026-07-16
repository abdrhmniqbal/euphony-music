/**
 * Purpose: Loads, sanitizes, and persists the selected app theme.
 * Caller: Appearance settings, app runtime preload, and root theme wrapper.
 * Dependencies: Settings repository, settings store, and app theme registry.
 * Main Functions: ensureThemeConfigLoaded(), setThemeConfig()
 * Side Effects: Reads and writes `app-theme.json` in Expo document storage and mutates settings state.
 */

import type { ThemeConfig } from "@/modules/settings/types"
import { createSettingsModule } from "@/modules/settings/factory"
import { getDefaultThemeConfig } from "@/modules/settings/store"
import { isAppThemeId } from "@/modules/ui/theme-registry"

function sanitizeConfig(config: unknown): ThemeConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}
  const defaultConfig = getDefaultThemeConfig()
  const themeId = isAppThemeId(source.themeId) ? source.themeId : defaultConfig.themeId

  return { themeId }
}

const mod = createSettingsModule<ThemeConfig>({
  fileName: "app-theme.json",
  stateKey: "themeConfig",
  getDefault: getDefaultThemeConfig,
  sanitize: sanitizeConfig,
})

export const ensureThemeConfigLoaded = mod.ensureLoaded
export const setThemeConfig = mod.set
