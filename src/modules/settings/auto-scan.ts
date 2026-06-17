/**
 * Purpose: Loads, sanitizes, and persists automatic indexer scan behavior settings.
 * Caller: Library settings screen, bootstrap startup scan, and media/foreground scan listeners.
 * Dependencies: Settings repository and settings store.
 * Main Functions: ensureAutoScanConfigLoaded(), setAutoScanConfig()
 * Side Effects: Reads and writes `indexer-auto-scan.json` in Expo document storage and mutates settings state.
 */

import type { IndexerScanConfig } from "@/modules/settings/types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultIndexerScanConfig,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"

const AUTO_SCAN_FILE = createSettingsConfigFile("indexer-auto-scan.json")

let loadPromise: Promise<IndexerScanConfig> | null = null
let hasLoadedConfig = false

function parseBoolean(
  source: Record<string, unknown>,
  key: keyof IndexerScanConfig,
  legacyKey?: string
) {
  const defaultValue = getDefaultIndexerScanConfig()[key]
  const value = source[key] ?? (legacyKey ? source[legacyKey] : undefined)
  return typeof value === "boolean" ? value : defaultValue
}

function sanitizeConfig(config: unknown): IndexerScanConfig {
  const source =
    config && typeof config === "object"
      ? (config as Record<string, unknown>)
      : {}

  return {
    autoScanEnabled: parseBoolean(source, "autoScanEnabled", "enabled"),
    rescanImmediatelyEnabled: parseBoolean(
      source,
      "rescanImmediatelyEnabled"
    ),
    initialScanEnabled: parseBoolean(source, "initialScanEnabled"),
  }
}

export async function ensureAutoScanConfigLoaded(): Promise<IndexerScanConfig> {
  if (hasLoadedConfig) {
    return getSettingsState().indexerScanConfig
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadSettingsConfig(
      AUTO_SCAN_FILE,
      getDefaultIndexerScanConfig(),
      sanitizeConfig
    )

    updateSettingsState({ indexerScanConfig: config })
    hasLoadedConfig = true
    return config
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setAutoScanConfig(
  updates: Partial<IndexerScanConfig>
): Promise<IndexerScanConfig> {
  await ensureAutoScanConfigLoaded()
  const current = getSettingsState().indexerScanConfig
  const next = sanitizeConfig({ ...current, ...updates })
  updateSettingsState({ indexerScanConfig: next })
  hasLoadedConfig = true
  await saveSettingsConfig(AUTO_SCAN_FILE, next)
  return next
}
