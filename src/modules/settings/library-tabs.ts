import { saveSettingsConfig } from "@/modules/settings/repository"
import { updateSettingsState } from "@/modules/settings/store"
import type { LibraryTabsConfig } from "@/modules/library/tabs"
import {
  createSettingsModule,
  ensureAtLeastOneVisibleTab,
  getDefaultLibraryTabsConfig,
  sanitizeLibraryTabsConfig,
} from "@/modules/library/tabs"

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
  hasLoadedConfig = true
  await saveSettingsConfig(FILE, next)
  return next
}
