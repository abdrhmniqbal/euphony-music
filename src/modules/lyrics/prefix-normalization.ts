const LRC_METADATA_HEADER_LINE_REGEX =
  /^\[(id|ti|ar|al|au|lr|length|by|offset|re|tool|re\/tool|ve)\s*:[^\]\r\n]*\]$/i

function stripFirstContentLinePrefix(lines: string[]) {
  const firstContentLineIndex = lines.findIndex((line) => {
    const trimmed = line.trim()
    return trimmed.length > 0 && !LRC_METADATA_HEADER_LINE_REGEX.test(trimmed)
  })

  if (firstContentLineIndex < 0) {
    return lines
  }

  const line = lines[firstContentLineIndex] ?? ""
  const trimmed = line.trimStart()

  if (trimmed.startsWith("攁杮")) {
    lines[firstContentLineIndex] = trimmed.slice(2).replace(/^\uFEFF+/, "")
    return lines
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

  return lines
}

export function stripMalformedUtf16LyricsPrefix(value: string) {
  const normalized = value.replace(/\r\n?/g, "\n")
  const lines = stripFirstContentLinePrefix(normalized.split("\n"))
  return lines.join("\n")
}
