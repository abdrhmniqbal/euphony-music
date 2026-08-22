import { File, Paths } from "expo-file-system"
import KvStore from "expo-sqlite/kv-store"

export interface SettingsConfigDescriptor {
  key: string
  legacyFile: File
}

export function createSettingsConfigFile(fileName: string): SettingsConfigDescriptor {
  return {
    key: `startune::settings::${fileName}`,
    legacyFile: new File(Paths.document, fileName),
  }
}

function toSettingsInput(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return {}
  }

  return value
}

async function migrateFileConfigToKvStore<T>(
  descriptor: SettingsConfigDescriptor,
  fallback: T,
  sanitize: (config: unknown) => T
): Promise<T> {
  if (!descriptor.legacyFile.exists) {
    return fallback
  }

  const raw = await descriptor.legacyFile.text()
  const parsed = JSON.parse(raw) as unknown
  const config = sanitize(toSettingsInput(parsed))
  await KvStore.setItem(descriptor.key, JSON.stringify(config))
  return config
}

export async function loadSettingsConfig<T>(
  descriptor: SettingsConfigDescriptor,
  fallback: T,
  sanitize: (config: unknown) => T
): Promise<T> {
  try {
    const cached = await KvStore.getItem(descriptor.key)
    if (cached) {
      const parsed = JSON.parse(cached) as unknown
      return sanitize(toSettingsInput(parsed))
    }

    return await migrateFileConfigToKvStore(descriptor, fallback, sanitize)
  } catch {
    return fallback
  }
}

async function persistLegacySettingsFileBestEffort<T>(legacyFile: File, config: T): Promise<void> {
  try {
    if (!legacyFile.exists) {
      legacyFile.create({
        intermediates: true,
        overwrite: true,
      })
    }

    legacyFile.write(JSON.stringify(config), {
      encoding: "utf8",
    })
  } catch (error) {
    console.warn("Failed to persist legacy settings JSON file", error)
  }
}

export async function saveSettingsConfig<T>(
  descriptor: SettingsConfigDescriptor,
  config: T
): Promise<void> {
  await KvStore.setItem(descriptor.key, JSON.stringify(config))
  void persistLegacySettingsFileBestEffort(descriptor.legacyFile, config)
}
