import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/prefix-normalization"

export interface LyricsLine {
  id: string
  text: string
  isSpacer: boolean
}

export const LRC_METADATA_HEADER_LINE_REGEX =
  /^\[(id|ti|ar|al|au|lr|length|by|offset|re|tool|re\/tool|ve)\s*:[^\]\r\n]*\]$/gim
export const LRC_COMMENT_LINE_REGEX = /^\s*#.*$/gm

function normalizeJsonLyrics(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return null
    }

    const lines = parsed
      .map((entry) => {
        if (
          entry &&
          typeof entry === "object" &&
          "text" in entry &&
          typeof entry.text === "string"
        ) {
          return entry.text
        }

        if (typeof entry === "string") {
          return entry
        }

        return null
      })
      .filter((value): value is string => value !== null)

    return lines.length > 0 ? lines.join("\n") : null
  } catch {
    return null
  }
}

function normalizeLyricsText(raw: string | null | undefined) {
  if (!raw) {
    return undefined
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return undefined
  }

  const maybeJson =
    trimmed.startsWith("[") || trimmed.startsWith("{") ? normalizeJsonLyrics(trimmed) : null
  const source = maybeJson ?? trimmed

  const normalized = stripMalformedUtf16LyricsPrefix(source)
    .replace(LRC_METADATA_HEADER_LINE_REGEX, "")
    .replace(LRC_COMMENT_LINE_REGEX, "")
    .replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return normalized.length > 0 ? normalized : undefined
}

export function stripLyricsMetadataHeaders(raw: string) {
  return stripMalformedUtf16LyricsPrefix(raw)
    .replace(LRC_METADATA_HEADER_LINE_REGEX, "")
    .replace(LRC_COMMENT_LINE_REGEX, "")
    .trim()
}

export function splitLyricsLines(raw: string | null | undefined): LyricsLine[] {
  const lyrics = normalizeLyricsText(raw)
  if (!lyrics) {
    return []
  }

  return lyrics.split("\n").map((line, index) => {
    const text = line.trim()
    return {
      id: `${index}-${text || "spacer"}`,
      text,
      isSpacer: text.length === 0,
    }
  })
}
