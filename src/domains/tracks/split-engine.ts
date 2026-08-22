import type { ArtistSplitMode, SplitMultipleValueConfig } from "@/core/preferences/types"

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

function splitByWords(value: string, words: string[]): string[] {
  if (!value.trim()) {
    return []
  }

  const terms = words
    .map((word) => word.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((word) => escapeRegExp(word))

  if (terms.length === 0) {
    return [value.trim()]
  }

  const regex = new RegExp(`\\s+(?:${terms.join("|")})\\s+`, "gi")

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

function splitArtistsWithConfig(value: string, config: SplitMultipleValueConfig): string[] {
  const { maskedValue, placeholders } = maskUnsplitArtists(value, config.unsplitArtists)

  const afterChars = splitBySymbols(maskedValue, config.artistCharDelimiters)
  const afterWords = afterChars.flatMap((part) => splitByWords(part, config.artistWordDelimiters))

  return dedupeValues(restoreMaskedArtists(afterWords, placeholders))
}

export function extractArtistFromTitle(
  title: string | null | undefined,
  config: SplitMultipleValueConfig
): string[] {
  if (!config.extractArtistFromTitle || !title) {
    return []
  }

  const terms = config.artistWordDelimiters
    .map((word) => word.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((word) => escapeRegExp(word))

  if (terms.length === 0) {
    return []
  }

  const termAlternation = terms.join("|")
  const normalized = title.replace(new RegExp(`\\((?=\\s*(?:${termAlternation}))`, "gi"), " ")
  const segments = splitByWords(normalized, config.artistWordDelimiters)

  return dedupeValues(
    segments
      .slice(1)
      .flatMap((segment) =>
        splitBySymbols(segment.replace(/^[(]+|[)]+$/g, "").trim(), config.artistCharDelimiters)
      )
  )
}

export function splitArtistsValue(
  value: string | null | undefined,
  config: SplitMultipleValueConfig,
  title?: string | null
): string[] {
  if (!value) {
    return []
  }

  if (config.artistSplitMode === "original") {
    return [value.trim()]
  }

  const base = splitArtistsWithConfig(value, config)
  if (!config.extractArtistFromTitle || !title) {
    return base
  }

  return dedupeValues([...base, ...extractArtistFromTitle(title, config)])
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
