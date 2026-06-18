import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/prefix-normalization"

function decodeInteger(bytes: Uint8Array, offset: number) {
  return (
    (((bytes[offset] || 0) << 24) |
      ((bytes[offset + 1] || 0) << 16) |
      ((bytes[offset + 2] || 0) << 8) |
      (bytes[offset + 3] || 0)) >>>
    0
  )
}

function getAtomType(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(
    bytes[offset] || 0,
    bytes[offset + 1] || 0,
    bytes[offset + 2] || 0,
    bytes[offset + 3] || 0
  )
}

function findMp4AtomData(
  bytes: Uint8Array,
  targetType: string,
  start = 0,
  end = bytes.length
): Uint8Array | null {
  let offset = start

  while (offset + 8 <= end) {
    const size = decodeInteger(bytes, offset)
    const type = getAtomType(bytes, offset + 4)
    if (size < 8) {
      break
    }

    const atomEnd = Math.min(end, offset + size)
    const childStart = type === "meta" ? offset + 12 : offset + 8

    if (type === targetType) {
      return bytes.slice(childStart, atomEnd)
    }

    if (type === "moov" || type === "udta" || type === "meta" || type === "ilst") {
      const nested = findMp4AtomData(bytes, targetType, childStart, atomEnd)
      if (nested) {
        return nested
      }
    }

    offset = atomEnd
  }

  return null
}

export function extractMp4Lyrics(bytes: Uint8Array) {
  const lyricAtom = findMp4AtomData(bytes, String.fromCharCode(0xa9, 0x6c, 0x79, 0x72))
  if (!lyricAtom) {
    return undefined
  }

  let offset = 0
  while (offset + 16 <= lyricAtom.length) {
    const childSize = decodeInteger(lyricAtom, offset)
    const childType = getAtomType(lyricAtom, offset + 4)
    if (childSize < 16) {
      break
    }

    const childEnd = Math.min(lyricAtom.length, offset + childSize)
    if (childType === "data") {
      const payload = lyricAtom.slice(offset + 16, childEnd)
      const lyrics = stripMalformedUtf16LyricsPrefix(
        new TextDecoder("utf-8").decode(payload)
      ).trim()
      if (lyrics) {
        return lyrics
      }
    }

    offset = childEnd
  }

  return undefined
}
