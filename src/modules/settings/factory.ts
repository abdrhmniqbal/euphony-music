/**
 * Purpose: Factory for generating settings module boilerplate (load, save, ensureLoaded, set).
 * Caller: Individual settings modules.
 * Dependencies: Settings repository and settings store.
 * Main Functions: createSettingsModule()
 * Side Effects: None — generates functions that read/write config files.
 */

import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import { getSettingsState, updateSettingsState } from "@/modules/settings/store"

interface SettingsModuleConfig<T> {
  fileName: string
  stateKey: string
  getDefault: () => T
  sanitize: (raw: unknown) => T
}

export function createSettingsModule<T>(config: SettingsModuleConfig<T>) {
  const file = createSettingsConfigFile(config.fileName)

  let loadPromise: Promise<T> | null = null
  let hasLoaded = false

  async function ensureLoaded(): Promise<T> {
    if (hasLoaded) {
      return (getSettingsState() as Record<string, T>)[config.stateKey]
    }

    if (loadPromise) {
      return loadPromise
    }

    loadPromise = (async () => {
      const loaded = await loadSettingsConfig(file, config.getDefault(), config.sanitize)
      updateSettingsState({ [config.stateKey]: loaded } as Record<string, T>)
      hasLoaded = true
      return loaded
    })()

    const result = await loadPromise
    loadPromise = null
    return result
  }

  async function set(updates: Partial<T>): Promise<T> {
    await ensureLoaded()
    const current = (getSettingsState() as Record<string, T>)[config.stateKey]
    const next = config.sanitize({ ...current, ...updates })
    updateSettingsState({ [config.stateKey]: next } as Record<string, T>)
    hasLoaded = true
    await saveSettingsConfig(file, next)
    return next
  }

  return { ensureLoaded, set }
}
