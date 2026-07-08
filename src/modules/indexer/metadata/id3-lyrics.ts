
const ID3_HEADER_SIZE = 10
const ID3_FRAME_HEADER_SIZE = 10
const ID3_TIMESTAMP_FORMAT_MILLISECONDS = 2

function hasByteRange(bytes: Uint8Array, offset: number, length: number) {
  return offset >= 0 && length >= 0 && offset + length <= bytes.length
}

function isSyncSafeInteger(bytes: Uint8Array, offset: number) {
  if (!hasByteRange(bytes, offset, 4)) {
    return false
  }

  return (
    ((bytes[offset] || 0) & 0x80) === 0 &&
    ((bytes[offset + 1] || 0) & 0x80) === 0 &&
    ((bytes[offset + 2] || 0) & 0x80) === 0 &&
    ((bytes[offset + 3] || 0) & 0x80) === 0
  )
}

function decodeSyncSafeInteger(bytes: Uint8Array, offset: number) {
  if (!isSyncSafeInteger(bytes, offset)) {
    return 0
  }

  return (
    ((bytes[offset] || 0) << 21) |
    ((bytes[offset + 1] || 0) << 14) |
    ((bytes[offset + 2] || 0) << 7) |
    (bytes[offset + 3] || 0)
  )
}

function decodeInteger(bytes: Uint8Array, offset: number) {
  if (!hasByteRange(bytes, offset, 4)) {
    return 0
  }

  return (
    (((bytes[offset] || 0) << 24) |
      ((bytes[offset + 1] || 0) << 16) |
      ((bytes[offset + 2] || 0) << 8) |
      (bytes[offset + 3] || 0)) >>>
    0
  )
}

function decodeTextValue(bytes: Uint8Array, encoding: number) {
  if (bytes.length === 0) {
    return ""
  }

  try {
    switch (encoding) {
      case 0:
      case 3:
      default:
        return new TextDecoder("utf-8").decode(bytes)
      case 1:
        return new TextDecoder("utf-16").decode(bytes)
      case 2:
        return new TextDecoder("utf-16be").decode(bytes)
    }
  } catch {
    return ""
  }
}

function findEncodedTextTerminator(bytes: Uint8Array, encoding: number) {
  if (encoding === 0 || encoding === 3) {
    return bytes.indexOf(0)
  }

  for (let i = 0; i < bytes.length - 1; i += 1) {
    if (bytes[i] === 0 && bytes[i + 1] === 0) {
      return i
    }
  }

  return -1
}

function formatLrcTimestamp(timeSeconds: number) {
  const safe = Math.max(0, timeSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = Math.floor(safe % 60)
  const centiseconds = Math.floor((safe - Math.floor(safe)) * 100)

  return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}]`
}

function extractId3SyncedLyrics(frameBytes: Uint8Array) {
  if (frameBytes.length <= 6) {
    return undefined
  }

  const encoding = frameBytes[0] || 0
  const timestampFormat = frameBytes[4] || 0
  if (timestampFormat !== ID3_TIMESTAMP_FORMAT_MILLISECONDS) {
    return undefined
  }

  const descriptorAndData = frameBytes.slice(6)
  const descriptorEnd = findEncodedTextTerminator(descriptorAndData, encoding)
  if (descriptorEnd < 0) {
    return undefined
  }

  const dataStart = descriptorEnd + (encoding === 0 || encoding === 3 ? 1 : 2)
  const payload = descriptorAndData.slice(dataStart)
  if (payload.length === 0) {
    return undefined
  }

  const lines: Array<{ time: number; text: string }> = []
  let offset = 0
  while (offset < payload.length) {
    const remaining = payload.slice(offset)
    const textEnd = findEncodedTextTerminator(remaining, encoding)
    if (textEnd < 0) {
      break
    }

    const textBytes = remaining.slice(0, textEnd)
    const text = decodeTextValue(textBytes, encoding).trim()
    const separatorLength = encoding === 0 || encoding === 3 ? 1 : 2
    const timestampOffset = offset + textEnd + separatorLength
    if (timestampOffset + 4 > payload.length) {
      break
    }

    const timestamp = decodeInteger(payload, timestampOffset) >>> 0
    offset = timestampOffset + 4

    if (!text) {
      continue
    }

    lines.push({
      time: timestamp / 1000,
      text,
    })
  }

  if (lines.length === 0) {
    return undefined
  }

  return lines
    .sort((a, b) => a.time - b.time)
    .map((line) => `${formatLrcTimestamp(line.time)}${line.text}`)
    .join("\n")
}

export function extractId3Lyrics(bytes: Uint8Array) {
  if (
    bytes.length < ID3_HEADER_SIZE ||
    bytes[0] !== 0x49 ||
    bytes[1] !== 0x44 ||
    bytes[2] !== 0x33
  ) {
    return undefined
  }

  const version = bytes[3] || 0
  if (!isSyncSafeInteger(bytes, 6)) {
    return undefined
  }

  const tagSize = decodeSyncSafeInteger(bytes, 6)
  const tagEnd = Math.min(bytes.length, ID3_HEADER_SIZE + tagSize)
  let offset = ID3_HEADER_SIZE

  while (offset + ID3_FRAME_HEADER_SIZE <= tagEnd) {
    const frameId = String.fromCharCode(
      bytes[offset] || 0,
      bytes[offset + 1] || 0,
      bytes[offset + 2] || 0,
      bytes[offset + 3] || 0
    ).replaceAll("\0", "")

    if (!frameId) {
      break
    }

    if (version === 4 && !isSyncSafeInteger(bytes, offset + 4)) {
      break
    }

    const frameSize =
      version === 4 ? decodeSyncSafeInteger(bytes, offset + 4) : decodeInteger(bytes, offset + 4)
    if (frameSize <= 0) {
      break
    }

    const frameStart = offset + ID3_FRAME_HEADER_SIZE
    const frameEnd = Math.min(tagEnd, frameStart + frameSize)
    if (frameEnd <= frameStart) {
      break
    }

    if (frameId === "SYLT") {
      const frameBytes = bytes.slice(frameStart, frameEnd)
      const syncedLyrics = extractId3SyncedLyrics(frameBytes)
      if (syncedLyrics) {
        return syncedLyrics
      }
    }

    if (frameId === "USLT") {
      const frameBytes = bytes.slice(frameStart, frameEnd)
      const encoding = frameBytes[0] || 0
      const descriptorAndLyrics = frameBytes.slice(4)
      const descriptorEnd = findEncodedTextTerminator(descriptorAndLyrics, encoding)
      const lyricsStart =
        descriptorEnd >= 0 ? descriptorEnd + (encoding === 0 || encoding === 3 ? 1 : 2) : 0
      const lyricsBytes = descriptorAndLyrics.slice(lyricsStart)
      const lyrics = decodeTextValue(lyricsBytes, encoding).trim()
      if (lyrics) {
        return lyrics
      }
    }

    offset = frameEnd
  }

  return undefined
}
