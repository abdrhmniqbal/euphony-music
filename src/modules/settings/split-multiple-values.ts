/**
 * Purpose: Persists configurable split behavior for artists and genres and provides normalized parsing helpers.
 * Caller: Library split settings screen, metadata indexer, player and track UI formatting helpers.
 * Dependencies: Settings repository/store and settings type definitions.
 * Main Functions: ensureSplitMultipleValueConfigLoaded(), setSplitMultipleValueConfig(), splitArtistsValue(), splitGenresValue(), formatArtistsForDisplay().
 * Side Effects: Reads/writes split-multiple-values.json and mutates in-memory settings state.
 */

import type { ArtistSplitMode, SplitMultipleValueConfig } from "@/modules/settings/types"
import { createSettingsModule } from "@/modules/settings/factory"
import { getDefaultSplitMultipleValueConfig } from "@/modules/settings/store"

export type { ArtistSplitMode, SplitMultipleValueConfig }
export {
  extractArtistFromTitle,
  formatArtistsForDisplay,
  splitArtistsValue,
} from "@/modules/settings/split-engine"

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
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}

  const defaults = getDefaultSplitMultipleValueConfig()
  const artistSplitMode: ArtistSplitMode =
    source.artistSplitMode === "original" ? "original" : "split"

  return {
    artistSplitMode,
    artistCharDelimiters: sanitizeSymbols(
      source.artistCharDelimiters,
      defaults.artistCharDelimiters
    ),
    artistWordDelimiters: sanitizeSymbols(
      source.artistWordDelimiters,
      defaults.artistWordDelimiters
    ),
    extractArtistFromTitle: Boolean(source.extractArtistFromTitle),
    unsplitArtists: sanitizeArtists(source.unsplitArtists),
    genreSplitSymbols: sanitizeSymbols(source.genreSplitSymbols, defaults.genreSplitSymbols),
  }
}

const mod = createSettingsModule<SplitMultipleValueConfig>({
  fileName: "split-multiple-values.json",
  stateKey: "splitMultipleValueConfig",
  getDefault: getDefaultSplitMultipleValueConfig,
  sanitize: sanitizeConfig,
})

export const ensureSplitMultipleValueConfigLoaded = mod.ensureLoaded
export const setSplitMultipleValueConfig = mod.set

export function splitGenresValue(
  value: string | null | undefined,
  config: SplitMultipleValueConfig
): string[] {
  if (!value) {
    return []
  }

  const escapedSymbols = config.genreSplitSymbols
    .map((symbol) => symbol.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))

  if (escapedSymbols.length === 0) {
    return [value.trim()]
  }

  const regex = new RegExp(`\\s*(?:${escapedSymbols.join("|")})\\s*`, "gi")

  return value
    .split(regex)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}
