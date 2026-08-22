/**
 * Purpose: Loads, sanitizes, and persists the minimum playback percentage required before a track counts as played.
 * Caller: Library settings screen, bootstrap settings preload, and player activity service.
 * Dependencies: Settings factory, settings store, and settings type definitions.
 * Main Functions: ensureCountAsPlayedConfigLoaded(), setCountAsPlayedConfig()
 * Side Effects: Reads and writes `count-as-played.json` in Expo document storage and mutates settings state.
 */

import type { CountAsPlayedConfig } from "@/modules/settings/types"
import { getDefaultCountAsPlayedConfig } from "@/modules/settings/store"
import { createSettingsModule } from "@/modules/settings/factory"

function sanitizeMinimumPlayedPercent(value: unknown) {
  const fallback = getDefaultCountAsPlayedConfig().minimumPlayedPercent
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }
  return Math.max(1, Math.min(100, Math.round(value)))
}

function sanitizeConfig(config: unknown): CountAsPlayedConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}
  return {
    minimumPlayedPercent: sanitizeMinimumPlayedPercent(source.minimumPlayedPercent),
  }
}

const mod = createSettingsModule<CountAsPlayedConfig>({
  fileName: "count-as-played.json",
  stateKey: "countAsPlayedConfig",
  getDefault: getDefaultCountAsPlayedConfig,
  sanitize: sanitizeConfig,
})

export const ensureCountAsPlayedConfigLoaded = mod.ensureLoaded
export const setCountAsPlayedConfig = mod.set
