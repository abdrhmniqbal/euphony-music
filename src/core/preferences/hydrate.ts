/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- MMKV hydration boundary: validating unparsed stored values requires unknown inputs and Record<string, unknown> narrowing */
import { isRecord } from "@/lib/guards"

type PreferenceMap = Record<string, unknown>

export function hydrateWithDefaults<T extends object>(defaults: T, stored: unknown): T {
  if (!isRecord(stored)) {
    return defaults
  }

  const result: PreferenceMap = {}

  for (const key of Object.keys(defaults)) {
    // SAFETY: defaults is T extends object; its own keys are exactly the loop keys read below
    const defaultValue = (defaults as PreferenceMap)[key]
    const storedValue = stored[key]

    if (storedValue === undefined) {
      result[key] = defaultValue
      continue
    }

    if (isRecord(defaultValue)) {
      result[key] = hydrateWithDefaults(defaultValue, storedValue)
    } else {
      result[key] = storedValue
    }
  }

  // SAFETY: every own key of defaults was assigned above, so the result keeps the shape of T
  return result as T
}
