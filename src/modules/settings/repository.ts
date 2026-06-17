import { File, Paths } from "expo-file-system"

export function createSettingsConfigFile(fileName: string) {
  return new File(Paths.document, fileName)
}

function toSettingsInput(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return {}
  }

  return value
}

export async function loadSettingsConfig<T>(
  file: File,
  fallback: T,
  sanitize: (config: unknown) => T
): Promise<T> {
  try {
    if (!file.exists) {
      return fallback
    }

    const raw = await file.text()
    const parsed = JSON.parse(raw) as unknown
    return sanitize(toSettingsInput(parsed))
  } catch {
    return fallback
  }
}

export async function saveSettingsConfig<T>(
  file: File,
  config: T
): Promise<void> {
  if (!file.exists) {
    file.create({
      intermediates: true,
      overwrite: true,
    })
  }

  file.write(JSON.stringify(config), {
    encoding: "utf8",
  })
}
