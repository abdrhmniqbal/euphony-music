import { hasMoreThanOneDistinctTime, parseTimedMarkupTimestamp } from "@/modules/lyrics/timing"

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

const TIMED_ANGLE_TAG_REGEX = /<(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?)>/g

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

function isTimedMarkupLyrics(raw: string): boolean {
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

function isTTML(raw: string): boolean {
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
