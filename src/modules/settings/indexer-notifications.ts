import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultIndexerNotificationsEnabled,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"

interface IndexerNotificationsConfig {
  enabled: boolean
}

const INDEXER_NOTIFICATIONS_FILE = createSettingsConfigFile(
  "indexer-notifications.json"
)

let loadPromise: Promise<boolean> | null = null
let hasLoadedConfig = false

function parseEnabled(value: unknown, fallback: boolean): boolean {
  if (!value || typeof value !== "object") {
    return fallback
  }

  const enabled = (value as Record<string, unknown>).enabled
  return typeof enabled === "boolean" ? enabled : fallback
}

export async function ensureIndexerNotificationsConfigLoaded(): Promise<boolean> {
  if (hasLoadedConfig) {
    return getSettingsState().indexerNotificationsEnabled
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const config = await loadSettingsConfig(
      INDEXER_NOTIFICATIONS_FILE,
      { enabled: getDefaultIndexerNotificationsEnabled() },
      (parsed) => ({
        enabled: parseEnabled(parsed, getDefaultIndexerNotificationsEnabled()),
      })
    )

    updateSettingsState({ indexerNotificationsEnabled: config.enabled })
    hasLoadedConfig = true
    return config.enabled
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setIndexerNotificationsEnabled(
  enabled: boolean
): Promise<boolean> {
  await ensureIndexerNotificationsConfigLoaded()
  updateSettingsState({ indexerNotificationsEnabled: enabled })
  hasLoadedConfig = true
  await saveSettingsConfig<IndexerNotificationsConfig>(
    INDEXER_NOTIFICATIONS_FILE,
    { enabled }
  )
  return enabled
}
