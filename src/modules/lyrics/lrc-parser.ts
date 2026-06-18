import { stripLyricsMetadataHeaders } from "@/modules/lyrics/plain-text"
import { hasMoreThanOneDistinctTime } from "@/modules/lyrics/timing"

export interface SyncedLyricsLine {
  id: string
  time: number
  text: string
}

interface JsonTimedLyricEntry {
  text?: unknown
  time?: unknown
  timestamp?: unknown
  start?: unknown
}

function parseJsonSyncedLyrics(raw: string): SyncedLyricsLine[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    const lines = parsed
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") {
          return null
        }

        const candidate = entry as JsonTimedLyricEntry
        const text = typeof candidate.text === "string" ? candidate.text.trim() : ""
        const timeValue =
          typeof candidate.time === "number"
            ? candidate.time
            : typeof candidate.timestamp === "number"
              ? candidate.timestamp
              : typeof candidate.start === "number"
                ? candidate.start
                : Number.NaN

        if (!text || !Number.isFinite(timeValue)) {
          return null
        }

        return {
          id: `json-${index}-${timeValue}-${text}`,
          text,
          time: Math.max(0, timeValue),
        }
      })
      .filter((line): line is SyncedLyricsLine => line !== null)

    return lines.sort((a, b) => a.time - b.time)
  } catch {
    return []
  }
}

export function parseSyncedLyricsLines(raw: string | null | undefined): SyncedLyricsLine[] {
  if (!raw) {
    return []
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const jsonLines = parseJsonSyncedLyrics(trimmed)
    if (jsonLines.length > 0) {
      return jsonLines
    }
  }

  const normalized = stripLyricsMetadataHeaders(trimmed)
  if (!normalized) {
    return []
  }

  const lines = normalized.split("\n")
  const parsed: SyncedLyricsLine[] = []

  for (const [index, line] of lines.entries()) {
    const timestampMatches = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)]
    if (timestampMatches.length === 0) {
      continue
    }

    const text = line.replace(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g, "").trim()
    if (!text) {
      continue
    }

    for (const [matchIndex, match] of timestampMatches.entries()) {
      const minutes = Number(match[1] || 0)
      const seconds = Number(match[2] || 0)
      const fractionText = match[3] || "0"
      const fractionScale = fractionText.length === 3 ? 1000 : fractionText.length === 2 ? 100 : 10
      const fraction = Number(fractionText) / fractionScale
      const time = minutes * 60 + seconds + fraction

      parsed.push({
        id: `${index}-${matchIndex}-${time}-${text}`,
        time,
        text,
      })
    }
  }

  return parsed.sort((a, b) => a.time - b.time)
}

export function hasMeaningfulSyncedLyricsTiming(lines: SyncedLyricsLine[]) {
  if (lines.length === 0) {
    return false
  }

  if (lines.some((line) => line.time > 0)) {
    return true
  }

  return hasMoreThanOneDistinctTime(lines.map((line) => line.time))
}
