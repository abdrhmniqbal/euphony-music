/**
 * Purpose: Loads, sanitizes, and persists the minimum playback percentage required before a track counts as played.
 * Caller: Library settings screen, bootstrap settings preload, and player activity service.
 * Dependencies: Settings repository, settings store, and settings type definitions.
 * Main Functions: ensureCountAsPlayedConfigLoaded(), setCountAsPlayedConfig()
 * Side Effects: Reads and writes `count-as-played.json` in Expo document storage and mutates settings state.
 */

import type { CountAsPlayedConfig } from "@/modules/settings/types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultCountAsPlayedConfig,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"

const COUNT_AS_PLAYED_FILE = createSettingsConfigFile("count-as-played.json")

let loadPromise: Promise<CountAsPlayedConfig> | null = null
let hasLoadedConfig = false

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

export async function ensureCountAsPlayedConfigLoaded(): Promise<CountAsPlayedConfig> {
  if (hasLoadedConfig) {
    return getSettingsState().countAsPlayedConfig
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadSettingsConfig(
      COUNT_AS_PLAYED_FILE,
      getDefaultCountAsPlayedConfig(),
      sanitizeConfig
    )

    updateSettingsState({ countAsPlayedConfig: config })
    hasLoadedConfig = true
    return config
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setCountAsPlayedConfig(
  updates: Partial<CountAsPlayedConfig>
): Promise<CountAsPlayedConfig> {
  await ensureCountAsPlayedConfigLoaded()
  const current = getSettingsState().countAsPlayedConfig
  const next = sanitizeConfig({ ...current, ...updates })
  updateSettingsState({ countAsPlayedConfig: next })
  hasLoadedConfig = true
  await saveSettingsConfig(COUNT_AS_PLAYED_FILE, next)
  return next
}
