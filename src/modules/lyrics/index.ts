/**
 * Purpose: Normalizes and parses static, synced, timestamp-tagged, and timed-markup lyric text.
 * Caller: Lyrics source resolver and player lyrics view.
 * Dependencies: JSON parsing and text normalization helpers.
 * Main Functions: normalizeLyricsText(), splitLyricsLines(), parseSyncedLyricsLines(), parseTimedMarkupLines(), parseTTMLLines(), hasMeaningfulTimedMarkupTiming(), hasMeaningfulTTMLTiming()
 * Side Effects: None.
 */

import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/prefix-normalization"

interface LyricsLine {
  id: string
  text: string
  isSpacer: boolean
}

interface SyncedLyricsLine {
  id: string
  time: number
  text: string
}

export interface TimedMarkupWord {
  text: string
  begin: number
  end: number
}

export interface TimedMarkupLine {
  id: string
  begin: number
  end: number
  words: TimedMarkupWord[]
}

export type TTMLWord = TimedMarkupWord
export type TTMLLine = TimedMarkupLine

function hasMoreThanOneDistinctTime(values: number[]) {
  const distinctValues = new Set(
    values.filter((value) => Number.isFinite(value)).map((value) => Math.round(value * 1000))
  )
  return distinctValues.size > 1
}

interface JsonTimedLyricEntry {
  text?: unknown
  time?: unknown
  timestamp?: unknown
  start?: unknown
}

const LRC_METADATA_HEADER_LINE_REGEX =
  /^\[(id|ti|ar|al|au|lr|length|by|offset|re|tool|re\/tool|ve)\s*:[^\]\r\n]*\]$/gim
const LRC_COMMENT_LINE_REGEX = /^\s*#.*$/gm
const TIMED_ANGLE_TAG_REGEX = /<(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)>/g

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

export function normalizeLyricsText(raw: string | null | undefined) {
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

function stripLyricsMetadataHeaders(raw: string) {
  return stripMalformedUtf16LyricsPrefix(raw)
    .replace(LRC_METADATA_HEADER_LINE_REGEX, "")
    .replace(LRC_COMMENT_LINE_REGEX, "")
    .trim()
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

function decodeMarkupText(raw: string) {
  return raw
    .replace(/<(?:\w+:)?br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function parseTimedMarkupTimestamp(raw: string): number {
  const normalized = raw.trim()
  if (!normalized) {
    return 0
  }

  const unitMatch = normalized.match(/^(-?\d+(?:\.\d+)?)(h|m|s|ms)$/i)
  if (unitMatch) {
    const value = Number.parseFloat(unitMatch[1] || "0")
    const unit = (unitMatch[2] || "").toLowerCase()
    if (unit === "h") {
      return value * 3600
    }

    if (unit === "m") {
      return value * 60
    }

    if (unit === "ms") {
      return value / 1000
    }

    return value
  }

  const parts = raw.split(":")
  if (parts.length === 3) {
    const hours = Number(parts[0] || 0)
    const minutes = Number(parts[1] || 0)
    const seconds = Number.parseFloat(parts[2] || "0")
    return hours * 3600 + minutes * 60 + seconds
  }
  if (parts.length === 2) {
    const minutes = Number(parts[0] || 0)
    const seconds = Number.parseFloat(parts[1] || "0")
    return minutes * 60 + seconds
  }
  return Number.parseFloat(raw) || 0
}

function readTimedMarkupAttribute(tag: string, name: string): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = tag.match(new RegExp(`(?:^|\\s|:)${escapedName}\\s*=\\s*(['"])(.*?)\\1`, "i"))
  return match?.[2]
}

function readTimedMarkupEnd(tag: string, begin: number): number {
  const end = readTimedMarkupAttribute(tag, "end")
  if (end !== undefined) {
    return parseTimedMarkupTimestamp(end)
  }

  const dur = readTimedMarkupAttribute(tag, "dur")
  if (dur !== undefined) {
    return begin + parseTimedMarkupTimestamp(dur)
  }

  return begin
}

function normalizeTimedMarkupWords(words: TimedMarkupWord[], fallbackLineEnd: number) {
  return words.map((word, index) => {
    if (word.end > word.begin) {
      return word
    }

    const nextWord = words[index + 1]
    const inferredEnd =
      nextWord && nextWord.begin > word.begin
        ? nextWord.begin
        : fallbackLineEnd > word.begin
          ? fallbackLineEnd
          : word.begin

    return {
      ...word,
      end: inferredEnd,
    }
  })
}

function normalizeTimedMarkupWordText(raw: string) {
  return raw.replace(/\s+/g, " ").trim()
}

function normalizeTimedMarkupWordSequence(words: TimedMarkupWord[]) {
  const normalizedWords: TimedMarkupWord[] = []
  let previousHadTrailingWhitespace = false

  for (const word of words) {
    const hadLeadingWhitespace = /^\s/.test(word.text)
    const hadTrailingWhitespace = /\s$/.test(word.text)
    const normalizedText = normalizeTimedMarkupWordText(word.text)

    if (!normalizedText) {
      continue
    }

    const shouldPrefixSpace =
      normalizedWords.length > 0 && (hadLeadingWhitespace || previousHadTrailingWhitespace)

    normalizedWords.push({
      ...word,
      text: shouldPrefixSpace ? ` ${normalizedText}` : normalizedText,
    })
    previousHadTrailingWhitespace = hadTrailingWhitespace
  }

  return normalizedWords
}

function isAngleTimedLyrics(raw: string): boolean {
  TIMED_ANGLE_TAG_REGEX.lastIndex = 0
  return TIMED_ANGLE_TAG_REGEX.test(raw)
}

function parseAngleTimedLine(rawLine: string, lineIndex: number) {
  TIMED_ANGLE_TAG_REGEX.lastIndex = 0
  const tags = [...rawLine.matchAll(TIMED_ANGLE_TAG_REGEX)].map((match) => ({
    time: parseTimedMarkupTimestamp(match[1] || "0"),
    index: match.index ?? 0,
    endIndex: (match.index ?? 0) + (match[0]?.length ?? 0),
  }))

  if (tags.length < 2) {
    return null
  }

  const words: TimedMarkupWord[] = []
  for (let index = 0; index < tags.length - 1; index += 1) {
    const current = tags[index]
    const next = tags[index + 1]
    if (!current || !next) {
      continue
    }

    const text = decodeMarkupText(rawLine.slice(current.endIndex, next.index))
    if (!text) {
      continue
    }

    words.push({
      text,
      begin: current.time,
      end: next.time,
    })
  }

  const normalizedWords = normalizeTimedMarkupWordSequence(words)

  if (normalizedWords.length === 0) {
    return null
  }

  return {
    id: `timed-angle-${lineIndex}`,
    begin: normalizedWords[0]?.begin ?? 0,
    end: normalizedWords[normalizedWords.length - 1]?.end ?? 0,
    words: normalizedWords,
  }
}

function parseAngleTimedLines(raw: string): TimedMarkupLine[] {
  return raw
    .split("\n")
    .map(parseAngleTimedLine)
    .filter((line): line is TimedMarkupLine => line !== null)
    .sort((a, b) => a.begin - b.begin)
}

export function isTimedMarkupLyrics(raw: string): boolean {
  const trimmed = raw.trim()
  const lower = trimmed.toLowerCase()
  return (
    lower.includes("<?xml") ||
    lower.includes("<tt") ||
    lower.includes("<html") ||
    isAngleTimedLyrics(trimmed) ||
    /<(?:\w+:)?p\b[^>]*(?:begin|end|dur)\s*=/i.test(trimmed) ||
    /<(?:\w+:)?span\b[^>]*(?:begin|end|dur)\s*=/i.test(trimmed)
  )
}

export function isTTML(raw: string): boolean {
  return isTimedMarkupLyrics(raw)
}

export function parseTimedMarkupLines(raw: string | null | undefined): TimedMarkupLine[] {
  if (!raw) {
    return []
  }

  const trimmed = raw.trim()
  if (!isTimedMarkupLyrics(trimmed)) {
    return []
  }

  const angleTimedLines = parseAngleTimedLines(trimmed)
  if (angleTimedLines.length > 0) {
    return angleTimedLines
  }

  const lines: TimedMarkupLine[] = []
  const pRegex = /<(?:\w+:)?p\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?p>/gi
  let pMatch: RegExpExecArray | null

  let lineIndex = 0
  while ((pMatch = pRegex.exec(trimmed)) !== null) {
    const pAttributes = pMatch[1] || ""
    const pBegin = parseTimedMarkupTimestamp(readTimedMarkupAttribute(pAttributes, "begin") || "0")
    const pEnd = readTimedMarkupEnd(pAttributes, pBegin)
    const innerContent = pMatch[2] || ""

    const words: TimedMarkupWord[] = []
    const spanRegex = /<(?:\w+:)?span\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?span>/gi
    let spanMatch: RegExpExecArray | null

    while ((spanMatch = spanRegex.exec(innerContent)) !== null) {
      const spanAttributes = spanMatch[1] || ""
      const begin = parseTimedMarkupTimestamp(
        readTimedMarkupAttribute(spanAttributes, "begin") || String(pBegin)
      )
      const end = readTimedMarkupEnd(spanAttributes, begin)
      const text = decodeMarkupText(spanMatch[2] || "")

      if (text) {
        words.push({ text, begin, end })
      }
    }

    const normalizedWords = normalizeTimedMarkupWordSequence(words)

    if (normalizedWords.length === 0) {
      const plainText = normalizeTimedMarkupWordText(decodeMarkupText(innerContent))

      if (plainText) {
        normalizedWords.push({ text: plainText, begin: pBegin, end: pEnd })
      }
    }

    if (normalizedWords.length > 0) {
      const finalizedWords = normalizeTimedMarkupWords(normalizedWords, pEnd)
      const firstBegin = Math.min(...finalizedWords.map((word) => word.begin))
      const lastEnd = Math.max(...finalizedWords.map((word) => word.end))
      const lineBegin =
        pBegin === 0 && Number.isFinite(firstBegin) && firstBegin > 0 ? firstBegin : pBegin
      const lineEnd = pEnd > lineBegin && Number.isFinite(pEnd) ? pEnd : lastEnd
      lines.push({
        id: `timed-markup-${lineIndex}`,
        begin: Number.isFinite(lineBegin) ? lineBegin : 0,
        end: Number.isFinite(lineEnd) ? lineEnd : 0,
        words: finalizedWords,
      })
      lineIndex++
    }
  }

  if (lines.length === 0) {
    const spanRegex = /<(?:\w+:)?span\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?span>/gi
    let spanMatch: RegExpExecArray | null
    const words: TimedMarkupWord[] = []

    while ((spanMatch = spanRegex.exec(trimmed)) !== null) {
      const spanAttributes = spanMatch[1] || ""
      const begin = parseTimedMarkupTimestamp(
        readTimedMarkupAttribute(spanAttributes, "begin") || "0"
      )
      const end = readTimedMarkupEnd(spanAttributes, begin)
      const text = decodeMarkupText(spanMatch[2] || "")

      if (text) {
        words.push({ text, begin, end })
      }
    }

    const normalizedWords = normalizeTimedMarkupWordSequence(words)

    if (normalizedWords.length > 0) {
      const firstBegin = Math.min(...normalizedWords.map((word) => word.begin))
      const lastEnd = Math.max(...normalizedWords.map((word) => word.end))
      const finalizedWords = normalizeTimedMarkupWords(normalizedWords, lastEnd)
      lines.push({
        id: "timed-markup-0",
        begin: Number.isFinite(firstBegin) ? firstBegin : 0,
        end: Number.isFinite(lastEnd) ? lastEnd : 0,
        words: finalizedWords,
      })
    }
  }

  return lines.sort((a, b) => a.begin - b.begin)
}

export function parseTTMLLines(raw: string | null | undefined): TTMLLine[] {
  return parseTimedMarkupLines(raw)
}

export function hasMeaningfulTimedMarkupTiming(lines: TimedMarkupLine[]) {
  if (lines.length === 0) {
    return false
  }

  const lineHasDuration = lines.some(
    (line) => line.end > line.begin || line.begin > 0 || line.end > 0
  )
  if (lineHasDuration) {
    return true
  }

  const words = lines.flatMap((line) => line.words)
  if (words.some((word) => word.end > word.begin || word.begin > 0 || word.end > 0)) {
    return true
  }

  return (
    hasMoreThanOneDistinctTime(lines.flatMap((line) => [line.begin, line.end])) ||
    hasMoreThanOneDistinctTime(words.flatMap((word) => [word.begin, word.end]))
  )
}

export function hasMeaningfulTTMLTiming(lines: TTMLLine[]) {
  return hasMeaningfulTimedMarkupTiming(lines)
}
