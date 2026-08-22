import { createSettingsConfigFile, saveSettingsConfig } from "@/modules/settings/repository"
import { updateSettingsState } from "@/modules/settings/store"
import { createSettingsModule } from "@/modules/settings/factory"
import type { LibraryTabsConfig } from "@/modules/library/tabs"
import {
  ensureAtLeastOneVisibleTab,
  getDefaultLibraryTabsConfig,
  sanitizeLibraryTabsConfig,
} from "@/modules/library/tabs"

const FILE = createSettingsConfigFile("library-tabs.json")

const mod = createSettingsModule<LibraryTabsConfig>({
  fileName: "library-tabs.json",
  stateKey: "libraryTabsConfig",
  getDefault: getDefaultLibraryTabsConfig,
  sanitize: sanitizeLibraryTabsConfig,
})

export const ensureLibraryTabsConfigLoaded = mod.ensureLoaded

export async function setLibraryTabsConfig(config: LibraryTabsConfig) {
  const next = ensureAtLeastOneVisibleTab(sanitizeLibraryTabsConfig(config))

  updateSettingsState({ libraryTabsConfig: next })
  await saveSettingsConfig(FILE, next)
  return next
}
