import type { TimedMarkupLine } from "@/modules/lyrics"

export function stripMalformedUtf16LyricsPrefix(value: string) {
  const normalized = value.replace(/\r\n?/g, "\n")
  const lines = normalized.split("\n")
  const firstContentLineIndex = lines.findIndex((line) => {
    const trimmed = line.trim()
    return (
      trimmed.length > 0 &&
      !/^\[(id|ti|ar|al|au|lr|length|by|offset|re|tool|re\/tool|ve)\s*:[^\]\r\n]*\]$/i.test(trimmed)
    )
  })

  if (firstContentLineIndex < 0) {
    return normalized
  }

  const line = lines[firstContentLineIndex] ?? ""
  const trimmed = line.trimStart()

  if (trimmed.startsWith("攁杮")) {
    lines[firstContentLineIndex] = trimmed.slice(2).replace(/^\uFEFF+/, "")
    return lines.join("\n")
  }

  const bomIndex = trimmed.indexOf("\uFEFF")
  if (bomIndex > 0 && bomIndex <= 4) {
    const trailingPrefix = trimmed.slice(bomIndex).match(/^\uFEFF+/)
    if (trailingPrefix) {
      const realText = trimmed.slice(bomIndex + trailingPrefix[0].length)
      if (realText) {
        lines[firstContentLineIndex] = realText
      }
    }
  }

  return lines.join("\n")
}

export function findActiveIndexByTime<T>(lines: T[], time: number, getTime: (line: T) => number) {
  let low = 0
  let high = lines.length - 1
  let activeIndex = -1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const lineTime = getTime(lines[mid] as T)

    if (time >= lineTime) {
      activeIndex = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return activeIndex
}

export function findTimedMarkupLineIndex(lines: TimedMarkupLine[], time: number) {
  return findActiveIndexByTime(lines, time, (line) => line.begin)
}

export function getTimedMarkupLineText(line: TimedMarkupLine) {
  return line.words.map((word) => word.text).join("")
}

export function getTimedMarkupDisplayText(text: string) {
  return text.trim().replace(/ /g, "\u00A0")
}

export function getTimedMarkupWordGroups(line: TimedMarkupLine) {
  const groups: TimedMarkupLine["words"][] = []

  for (const word of line.words) {
    const startsNewWord = /^\s/.test(word.text)
    const currentGroup = groups[groups.length - 1]

    if (!currentGroup || startsNewWord) {
      groups.push([word])
      continue
    }

    currentGroup.push(word)
  }

  return groups
}

export function hasWordLevelTiming(line: TimedMarkupLine) {
  if (line.words.length < 2) {
    return false
  }

  const distinctWordStarts = new Set(
    line.words
      .map((word) => word.begin)
      .filter((time) => Number.isFinite(time))
      .map((time) => Math.round(time * 1000))
  )

  return distinctWordStarts.size > 1
}

export function findSyncedLineIndex(lines: Array<{ time: number }>, time: number) {
  return findActiveIndexByTime(lines, time, (line) => line.time)
}
