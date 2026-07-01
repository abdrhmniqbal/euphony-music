/**
 * Purpose: Loads, sanitizes, and persists automatic indexer scan behavior settings.
 * Caller: Library settings screen, bootstrap startup scan, and media/foreground scan listeners.
 * Dependencies: Settings factory and settings store.
 * Main Functions: ensureAutoScanConfigLoaded(), setAutoScanConfig()
 * Side Effects: Reads and writes `indexer-auto-scan.json` in Expo document storage and mutates settings state.
 */

import type { IndexerScanConfig } from "@/modules/settings/types"
import { getDefaultIndexerScanConfig } from "@/modules/settings/store"
import { createSettingsModule } from "@/modules/settings/factory"

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
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}
  return {
    autoScanEnabled: parseBoolean(source, "autoScanEnabled", "enabled"),
    rescanImmediatelyEnabled: parseBoolean(source, "rescanImmediatelyEnabled"),
    initialScanEnabled: parseBoolean(source, "initialScanEnabled"),
  }
}

const mod = createSettingsModule<IndexerScanConfig>({
  fileName: "indexer-auto-scan.json",
  stateKey: "indexerScanConfig",
  getDefault: getDefaultIndexerScanConfig,
  sanitize: sanitizeConfig,
})

export const ensureAutoScanConfigLoaded = mod.ensureLoaded
export const setAutoScanConfig = mod.set
