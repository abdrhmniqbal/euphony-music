/**
 * Purpose: Persists configurable split behavior for artists and genres and provides normalized parsing helpers.
 * Caller: Library split settings screen, metadata indexer, player and track UI formatting helpers.
 * Dependencies: Settings repository/store and settings type definitions.
 * Main Functions: ensureSplitMultipleValueConfigLoaded(), setSplitMultipleValueConfig(), splitArtistsValue(), splitGenresValue(), formatArtistsForDisplay().
 * Side Effects: Reads/writes split-multiple-values.json and mutates in-memory settings state.
 */

import type {
  ArtistSplitMode,
  SplitMultipleValueConfig,
} from "@/modules/settings/types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultSplitMultipleValueConfig,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"

export type { ArtistSplitMode, SplitMultipleValueConfig }

const SPLIT_MULTIPLE_VALUES_FILE = createSettingsConfigFile(
  "split-multiple-values.json"
)

let loadPromise: Promise<SplitMultipleValueConfig> | null = null
let hasLoadedConfig = false

function sanitizeSymbols(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback
  }

  const seen = new Set<string>()
  const normalized: string[] = []

  for (const item of value) {
    if (typeof item !== "string") {
      continue
    }

    const symbol = item.trim()
    if (!symbol) {
      continue
    }

    const key = symbol.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    normalized.push(symbol)
  }

  return normalized.length > 0 ? normalized : fallback
}

function sanitizeArtists(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const normalized: string[] = []

  for (const item of value) {
    if (typeof item !== "string") {
      continue
    }

    const artist = item.trim()
    if (!artist) {
      continue
    }

    const key = artist.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    normalized.push(artist)
  }

  return normalized
}

function sanitizeConfig(config: unknown): SplitMultipleValueConfig {
  const source =
    config && typeof config === "object"
      ? (config as Record<string, unknown>)
      : {}

  const defaults = getDefaultSplitMultipleValueConfig()
  const artistSplitMode: ArtistSplitMode =
    source.artistSplitMode === "original" ? "original" : "split"

  return {
    artistSplitSymbols: sanitizeSymbols(
      source.artistSplitSymbols,
      defaults.artistSplitSymbols
    ),
    unsplitArtists: sanitizeArtists(source.unsplitArtists),
    artistSplitMode,
    genreSplitSymbols: sanitizeSymbols(
      source.genreSplitSymbols,
      defaults.genreSplitSymbols
    ),
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function maskUnsplitArtists(value: string, unsplitArtists: string[]) {
  const placeholders: string[] = []
  let maskedValue = value

  for (const unsplitArtist of unsplitArtists) {
    const escaped = escapeRegExp(unsplitArtist)
    const regex = new RegExp(escaped, "gi")
    maskedValue = maskedValue.replace(regex, (matched) => {
      const token = `@@UNSPLIT_${placeholders.length}@@`
      placeholders.push(matched)
      return token
    })
  }

  return { maskedValue, placeholders }
}

function restoreMaskedArtists(values: string[], placeholders: string[]) {
  if (placeholders.length === 0) {
    return values
  }

  return values.map((value) => {
    let restored = value
    placeholders.forEach((original, index) => {
      restored = restored.replace(`@@UNSPLIT_${index}@@`, original)
    })
    return restored
  })
}

function splitBySymbols(value: string, symbols: string[]): string[] {
  if (!value.trim()) {
    return []
  }

  const escapedSymbols = symbols
    .map((symbol) => symbol.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((symbol) => escapeRegExp(symbol))

  if (escapedSymbols.length === 0) {
    return [value.trim()]
  }

  const regex = new RegExp(`\\s*(?:${escapedSymbols.join("|")})\\s*`, "gi")

  return value
    .split(regex)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function dedupeValues(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const key = value.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(value)
  }

  return result
}

function splitArtistsWithConfig(
  value: string,
  config: SplitMultipleValueConfig
): string[] {
  const { maskedValue, placeholders } = maskUnsplitArtists(
    value,
    config.unsplitArtists
  )

  return dedupeValues(
    restoreMaskedArtists(
      splitBySymbols(maskedValue, config.artistSplitSymbols),
      placeholders
    )
  )
}

async function persistConfig(config: SplitMultipleValueConfig): Promise<void> {
  await saveSettingsConfig(SPLIT_MULTIPLE_VALUES_FILE, config)
}

export async function ensureSplitMultipleValueConfigLoaded(): Promise<SplitMultipleValueConfig> {
  if (hasLoadedConfig) {
    return getSettingsState().splitMultipleValueConfig
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const next = await loadSettingsConfig(
      SPLIT_MULTIPLE_VALUES_FILE,
      getDefaultSplitMultipleValueConfig(),
      sanitizeConfig
    )
    updateSettingsState({ splitMultipleValueConfig: next })
    hasLoadedConfig = true
    return next
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setSplitMultipleValueConfig(
  updates: Partial<SplitMultipleValueConfig>
): Promise<SplitMultipleValueConfig> {
  await ensureSplitMultipleValueConfigLoaded()
  const current = getSettingsState().splitMultipleValueConfig
  const next = sanitizeConfig({ ...current, ...updates })
  updateSettingsState({ splitMultipleValueConfig: next })
  hasLoadedConfig = true
  await persistConfig(next)
  return next
}

export function splitArtistsValue(
  value: string | null | undefined,
  config: SplitMultipleValueConfig
): string[] {
  if (!value) {
    return []
  }

  return splitArtistsWithConfig(value, config)
}

export function splitGenresValue(
  value: string | null | undefined,
  config: SplitMultipleValueConfig
): string[] {
  if (!value) {
    return []
  }

  return dedupeValues(splitBySymbols(value, config.genreSplitSymbols))
}

export function formatArtistsForDisplay(
  originalValue: string | null | undefined,
  splitValues: string[],
  mode: ArtistSplitMode
): string {
  if (mode === "original") {
    const normalizedOriginal = originalValue?.trim()
    if (normalizedOriginal) {
      return normalizedOriginal
    }
  }

  return splitValues.join(", ")
}
