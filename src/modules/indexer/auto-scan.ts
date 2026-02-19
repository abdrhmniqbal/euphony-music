import { atom } from "nanostores"
import { File, Paths } from "expo-file-system"

interface AutoScanConfig {
  enabled: boolean
}

const AUTO_SCAN_FILE = new File(Paths.document, "indexer-auto-scan.json")
const DEFAULT_AUTO_SCAN_ENABLED = true

export const $autoScanEnabled = atom<boolean>(DEFAULT_AUTO_SCAN_ENABLED)

let loadPromise: Promise<boolean> | null = null
let hasLoadedConfig = false

async function persistAutoScanConfig(config: AutoScanConfig): Promise<void> {
  if (!AUTO_SCAN_FILE.exists) {
    AUTO_SCAN_FILE.create({
      intermediates: true,
      overwrite: true,
    })
  }

  AUTO_SCAN_FILE.write(JSON.stringify(config), {
    encoding: "utf8",
  })
}

export async function ensureAutoScanConfigLoaded(): Promise<boolean> {
  if (hasLoadedConfig) {
    return $autoScanEnabled.get()
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    try {
      if (!AUTO_SCAN_FILE.exists) {
        $autoScanEnabled.set(DEFAULT_AUTO_SCAN_ENABLED)
        hasLoadedConfig = true
        return DEFAULT_AUTO_SCAN_ENABLED
      }

      const raw = await AUTO_SCAN_FILE.text()
      const parsed = JSON.parse(raw) as Partial<AutoScanConfig>
      const enabled =
        typeof parsed.enabled === "boolean"
          ? parsed.enabled
          : DEFAULT_AUTO_SCAN_ENABLED

      $autoScanEnabled.set(enabled)
      hasLoadedConfig = true
      return enabled
    } catch {
      $autoScanEnabled.set(DEFAULT_AUTO_SCAN_ENABLED)
      hasLoadedConfig = true
      return DEFAULT_AUTO_SCAN_ENABLED
    }
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setAutoScanEnabled(enabled: boolean): Promise<boolean> {
  await ensureAutoScanConfigLoaded()
  $autoScanEnabled.set(enabled)
  hasLoadedConfig = true
  await persistAutoScanConfig({ enabled })
  return enabled
}
