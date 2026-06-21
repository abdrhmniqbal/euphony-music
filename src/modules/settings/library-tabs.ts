import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository";
import {
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store";
import type { LibraryTabsConfig } from "@/modules/library/tabs";
import {
  getDefaultLibraryTabsConfig,
  sanitizeLibraryTabsConfig,
} from "@/modules/library/tabs";

const FILE = createSettingsConfigFile("library-tabs.json");
let promise: Promise<LibraryTabsConfig> | null = null;

export async function ensureLibraryTabsConfigLoaded() {
  if (getSettingsState().libraryTabsConfig)
    return getSettingsState().libraryTabsConfig;
  if (promise) return promise;
  promise = loadSettingsConfig(
    FILE,
    getDefaultLibraryTabsConfig(),
    sanitizeLibraryTabsConfig,
  ).then((config) => {
    updateSettingsState({ libraryTabsConfig: config });
    promise = null;
    return config;
  });
  return promise;
}

export async function setLibraryTabsConfig(config: LibraryTabsConfig) {
  const next = sanitizeLibraryTabsConfig(config);
  updateSettingsState({ libraryTabsConfig: next });
  await saveSettingsConfig(FILE, next);
  return next;
}
