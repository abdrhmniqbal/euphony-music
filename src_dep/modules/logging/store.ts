import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultLoggingConfig,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"
import type { AppLogLevel, LoggingConfig } from "./types"

const LOG_CONFIG_FILE = createSettingsConfigFile("logging-config.json")

export function getLoggingConfigState(): LoggingConfig {
  return getSettingsState().loggingConfig
}

export async function ensureLoggingConfigLoaded(): Promise<LoggingConfig> {
  const fallback = getDefaultLoggingConfig()
  
  const config = await loadSettingsConfig(LOG_CONFIG_FILE, fallback, (val: any) => ({
    level: val?.level === "extra" ? "extra" : fallback.level,
  })).catch(() => fallback)
  
  updateSettingsState({ loggingConfig: config })
  return config
}

export async function setAppLogLevel(level: AppLogLevel): Promise<void> {
  const next: LoggingConfig = { level }
  updateSettingsState({ loggingConfig: next })
  await saveSettingsConfig(LOG_CONFIG_FILE, next)
}
