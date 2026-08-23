export interface StaticLine {
  id: string
  text: string
  isSpacer: boolean
}

export interface SyncedLine {
  id: string
  time: number
  text: string
}

export interface TimedWord {
  text: string
  begin: number
  end: number
}

export interface TimedLine {
  id: string
  begin: number
  end: number
  words: TimedWord[]
}

export type LyricsDoc =
  | { kind: "empty" }
  | { kind: "static"; lines: StaticLine[] }
  | { kind: "synced"; lines: SyncedLine[] }
  | { kind: "timed"; lines: TimedLine[] }

const LRC_METADATA_HEADER_LINE_REGEX =
  /^\[(id|ti|ar|al|au|lr|length|by|offset|re|tool|re\/tool|ve)\s*:[^\]\r\n]*\]$/gim
const LRC_COMMENT_LINE_REGEX = /^\s*#.*$/gm
const LRC_STRUCTURE_LINE_REGEX = /^\[[^\]\r\n]*\]$/gm
const LRC_TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g
const TIMED_ANGLE_TAG_REGEX = /<(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)>/g

export function parseTimedMarkupTimestamp(raw: string): number {
  const normalized = raw.trim()
  if (!normalized) {
    return 0
  }

  const unitMatch = normalized.match(/^(-?\d+(?:\.\d+)?)(h|m|s|ms)$/i)
  if (unitMatch) {
    const value = Number.parseFloat(unitMatch[1] || "0")
    const unit = (unitMatch[2] || "").toLowerCase()
    if (unit === "h") return value * 3600
    if (unit === "m") return value * 60
    if (unit === "ms") return value / 1000
    return value
  }

  const parts = raw.split(":")
  if (parts.length === 3) {
    return Number(parts[0] || 0) * 3600 + Number(parts[1] || 0) * 60 + Number.parseFloat(parts[2] || 0)
  }
  if (parts.length === 2) {
    return Number(parts[0] || 0) * 60 + Number.parseFloat(parts[1] || 0)
  }
  return Number.parseFloat(raw) || 0
}

function hasMoreThanOneDistinctTime(values: number[]): boolean {
  const distinct = new Set(
    values.filter((v) => Number.isFinite(v)).map((v) => Math.round(v * 1000))
  )
  return distinct.size > 1
}

function findActiveIndex<T>(lines: T[], time: number, getTime: (line: T) => number): number {
  let low = 0
  let high = lines.length - 1
  let active = -1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const lineTime = getTime(lines[mid] as T)
    if (time >= lineTime) {
      active = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return active
}

export function findSyncedLineIndex(lines: SyncedLine[], time: number): number {
  return findActiveIndex(lines, time, (line) => line.time)
}

export function findTimedLineIndex(lines: TimedLine[], time: number): number {
  return findActiveIndex(lines, time, (line) => line.begin)
}

export function getTimedLineText(line: TimedLine): string {
  return line.words.map((word) => word.text).join("")
}

export function getTimedDisplayText(text: string): string {
  return text.trim().replace(/ /g, " ")
}

export function hasWordLevelTiming(line: TimedLine): boolean {
  if (line.words.length < 2) {
    return false
  }

  const distinct = new Set(
    line.words
      .map((word) => word.begin)
      .filter((time) => Number.isFinite(time))
      .map((time) => Math.round(time * 1000))
  )

  return distinct.size > 1
}

export function getTimedWordGroups(line: TimedLine): TimedWord[][] {
  const groups: TimedWord[][] = []

  for (const word of line.words) {
    const startsNewWord = /^\s/.test(word.text)
    const current = groups[groups.length - 1]

    if (!current || startsNewWord) {
      groups.push([word])
      continue
    }

    current.push(word)
  }

  return groups
}

function decodeMarkupText(raw: string): string {
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

function readAttribute(tag: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = tag.match(new RegExp(`(?:^|\\s|:)${escaped}\\s*=\\s*(['"])(.*?)\\1`, "i"))
  return match?.[2]
}

function readEnd(tag: string, begin: number): number {
  const end = readAttribute(tag, "end")
  if (end !== undefined) {
    return parseTimedMarkupTimestamp(end)
  }

  const dur = readAttribute(tag, "dur")
  if (dur !== undefined) {
    return begin + parseTimedMarkupTimestamp(dur)
  }

  return begin
}

function normalizeWordText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim()
}

function normalizeWords(words: TimedWord[], lineEnd: number): TimedWord[] {
  const normalized: TimedWord[] = []
  let prevTrailing = false

  for (const word of words) {
    const leading = /^\s/.test(word.text)
    const trailing = /\s$/.test(word.text)
    const text = normalizeWordText(word.text)
    if (!text) {
      continue
    }

    const needsSpace = normalized.length > 0 && (leading || prevTrailing)
    normalized.push({ ...word, text: needsSpace ? ` ${text}` : text })
    prevTrailing = trailing
  }

  return normalized.map((word, index) => {
    if (word.end > word.begin) {
      return word
    }

    const next = normalized[index + 1]
    const inferred =
      next && next.begin > word.begin
        ? next.begin
        : lineEnd > word.begin
          ? lineEnd
          : word.begin
    return { ...word, end: inferred }
  })
}

function extractSpans(content: string, fallbackBegin: number): TimedWord[] {
  const regex = /<(?:\w+:)?span\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?span>/gi
  const words: TimedWord[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    const begin = parseTimedMarkupTimestamp(readAttribute(match[1] || "", "begin") || String(fallbackBegin))
    const end = readEnd(match[1] || "", begin)
    const text = decodeMarkupText(match[2] || "")
    if (text) {
      words.push({ text, begin, end })
    }
  }

  return words
}

function parseTimedLines(raw: string): TimedLine[] {
  const trimmed = raw.trim()

  const angleLines = parseAngleTimedLines(trimmed)
  if (angleLines.length > 0) {
    return angleLines
  }

  const lines: TimedLine[] = []
  const lineRegex = /<(?:\w+:)?(p|text)\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?\1>/gi
  let lineMatch: RegExpExecArray | null
  let index = 0

  while ((lineMatch = lineRegex.exec(trimmed)) !== null) {
    const attrs = lineMatch[2] || ""
    const inner = lineMatch[3] || ""
    const lineBegin = parseTimedMarkupTimestamp(readAttribute(attrs, "begin") || "0")
    const lineEnd = readEnd(attrs, lineBegin)
    const words = normalizeWords(extractSpans(inner, lineBegin), lineEnd)

    if (words.length === 0) {
      const plain = normalizeWordText(decodeMarkupText(inner))
      if (plain) {
        words.push({ text: plain, begin: lineBegin, end: lineEnd })
      }
    }

    if (words.length > 0) {
      lines.push({
        id: `timed-${index}`,
        begin: lineBegin,
        end: lineEnd,
        words,
      })
      index += 1
    }
  }

  if (lines.length === 0) {
    const words = normalizeWords(extractSpans(trimmed, 0), 0)
    if (words.length > 0) {
      lines.push({ id: "timed-0", begin: words[0]?.begin ?? 0, end: 0, words })
    }
  }

  return lines.sort((a, b) => a.begin - b.begin)
}

function parseAngleTimedLines(raw: string): TimedLine[] {
  return raw
    .split("\n")
    .map((rawLine, lineIndex) => {
      TIMED_ANGLE_TAG_REGEX.lastIndex = 0
      const tags = [...rawLine.matchAll(TIMED_ANGLE_TAG_REGEX)].map((match) => ({
        time: parseTimedMarkupTimestamp(match[1] || "0"),
        index: match.index ?? 0,
        endIndex: (match.index ?? 0) + (match[0]?.length ?? 0),
      }))

      if (tags.length < 2) {
        return null
      }

      const words: TimedWord[] = []
      for (let i = 0; i < tags.length - 1; i += 1) {
        const current = tags[i]
        const next = tags[i + 1]
        if (!current || !next) {
          continue
        }
        const text = decodeMarkupText(rawLine.slice(current.endIndex, next.index))
        if (text) {
          words.push({ text, begin: current.time, end: next.time })
        }
      }

      const normalized = normalizeWords(words, 0)
      if (normalized.length === 0) {
        return null
      }

      return {
        id: `timed-angle-${lineIndex}`,
        begin: normalized[0]?.begin ?? 0,
        end: normalized[normalized.length - 1]?.end ?? 0,
        words: normalized,
      }
    })
    .filter((line): line is TimedLine => line !== null)
    .sort((a, b) => a.begin - b.begin)
}

function isTimedMarkup(raw: string): boolean {
  const lower = raw.trim().toLowerCase()
  return (
    lower.includes("<?xml") ||
    lower.includes("<tt") ||
    lower.includes("<html") ||
    lower.includes("<p") ||
    lower.includes("<text") ||
    lower.includes("<span") ||
    lower.includes("<div") ||
    (TIMED_ANGLE_TAG_REGEX.lastIndex = 0) || TIMED_ANGLE_TAG_REGEX.test(raw)
  )
}

function hasTimedTiming(lines: TimedLine[]): boolean {
  if (lines.length === 0) {
    return false
  }

  const times = lines.flatMap((line) => [line.begin, line.end, ...line.words.flatMap((w) => [w.begin, w.end])])
  return times.some((t) => t > 0) || hasMoreThanOneDistinctTime(times)
}

interface JsonTimedEntry {
  text?: unknown
  time?: unknown
  timestamp?: unknown
  start?: unknown
}

function parseJsonSynced(raw: string): SyncedLine[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const lines = parsed
      .map((entry, index): SyncedLine | null => {
        if (!entry || typeof entry !== "object") {
          return null
        }
        const candidate = entry as JsonTimedEntry
        const text = typeof candidate.text === "string" ? candidate.text.trim() : ""
        const time = (
          ["time", "timestamp", "start"] as const
        ).map((key) => candidate[key])
          .find((value): value is number => typeof value === "number")

        if (!text || time === undefined || !Number.isFinite(time)) {
          return null
        }

        return { id: `json-${index}`, text, time: Math.max(0, time) }
      })
      .filter((line): line is SyncedLine => line !== null)

    return lines.sort((a, b) => a.time - b.time)
  } catch {
    return []
  }
}

function parseLrc(raw: string): SyncedLine[] {
  const normalized = stripHeaders(raw)
  if (!normalized) {
    return []
  }

  const parsed: SyncedLine[] = []
  normalized.split("\n").forEach((line, index) => {
    const matches = [...line.matchAll(LRC_TIMESTAMP_REGEX)]
    if (matches.length === 0) {
      return
    }

    const text = line.replace(LRC_TIMESTAMP_REGEX, "").trim()
    if (!text) {
      return
    }

    matches.forEach((match, matchIndex) => {
      const minutes = Number(match[1] || 0)
      const seconds = Number(match[2] || 0)
      const fractionText = match[3] || "0"
      const scale = fractionText.length === 3 ? 1000 : fractionText.length === 2 ? 100 : 10
      const time = minutes * 60 + seconds + Number(fractionText) / scale
      parsed.push({ id: `${index}-${matchIndex}`, text, time })
    })
  })

  return parsed.sort((a, b) => a.time - b.time)
}

function stripHeaders(raw: string): string {
  return raw
    .replace(LRC_METADATA_HEADER_LINE_REGEX, "")
    .replace(LRC_COMMENT_LINE_REGEX, "")
    .replace(LRC_STRUCTURE_LINE_REGEX, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function parseStatic(raw: string): StaticLine[] {
  const normalized = stripHeaders(raw).replace(LRC_TIMESTAMP_REGEX, "").trim()
  if (!normalized) {
    return []
  }

  return normalized.split("\n").map((line, index) => {
    const text = line.trim()
    return { id: `${index}-${text || "spacer"}`, text, isSpacer: text.length === 0 }
  })
}

export function parseLyrics(raw: string | null | undefined): LyricsDoc {
  if (!raw || !raw.trim()) {
    return { kind: "empty" }
  }

  const trimmed = raw.trim()

  if (isTimedMarkup(trimmed)) {
    const lines = parseTimedLines(trimmed)
    if (lines.length > 0 && hasTimedTiming(lines)) {
      return { kind: "timed", lines }
    }
  }

  const jsonLines =
    trimmed.startsWith("[") || trimmed.startsWith("{") ? parseJsonSynced(trimmed) : []
  const synced = jsonLines.length > 0 ? jsonLines : parseLrc(trimmed)
  if (synced.length > 0 && (synced.some((line) => line.time > 0) || hasMoreThanOneDistinctTime(synced.map((l) => l.time)))) {
    return { kind: "synced", lines: synced }
  }

  const staticLines = parseStatic(trimmed)
  if (staticLines.length > 0) {
    return { kind: "static", lines: staticLines }
  }

  return { kind: "empty" }
}
