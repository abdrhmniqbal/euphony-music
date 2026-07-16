import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import { getSettingsState, updateSettingsState } from "@/modules/settings/store"
import type { LibraryTabsConfig } from "@/modules/library/tabs"
import {
  ensureAtLeastOneVisibleTab,
  getDefaultLibraryTabsConfig,
  sanitizeLibraryTabsConfig,
} from "@/modules/library/tabs"

const FILE = createSettingsConfigFile("library-tabs.json")
let promise: Promise<LibraryTabsConfig> | null = null
let hasLoadedConfig = false

export async function ensureLibraryTabsConfigLoaded() {
  if (hasLoadedConfig) return getSettingsState().libraryTabsConfig
  if (promise) return promise
  promise = loadSettingsConfig(FILE, getDefaultLibraryTabsConfig(), sanitizeLibraryTabsConfig).then(
    (config) => {
      updateSettingsState({ libraryTabsConfig: config })
      hasLoadedConfig = true
      promise = null
      return config
    }
  )
  return promise
}

export async function setLibraryTabsConfig(config: LibraryTabsConfig) {
  const next = ensureAtLeastOneVisibleTab(sanitizeLibraryTabsConfig(config))

  updateSettingsState({ libraryTabsConfig: next })
  hasLoadedConfig = true
  await saveSettingsConfig(FILE, next)
  return next
}
