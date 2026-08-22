export function hydrateWithDefaults<T extends object>(defaults: T, stored: unknown): T {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return defaults
  }

  const source = stored as Record<string, unknown>
  const result = { ...defaults } as Record<string, unknown>

  for (const key of Object.keys(defaults)) {
    const defaultValue = (defaults as Record<string, unknown>)[key]
    const storedValue = source[key]

    if (storedValue === undefined) continue

    if (defaultValue !== null && typeof defaultValue === "object" && !Array.isArray(defaultValue)) {
      result[key] = hydrateWithDefaults(defaultValue, storedValue)
    } else {
      result[key] = storedValue
    }
  }

  return result as T
}
