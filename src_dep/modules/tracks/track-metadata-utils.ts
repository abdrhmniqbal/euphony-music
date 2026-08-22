export function normalizeCodecLabel(codec?: string): string | undefined {
  if (!codec) {
    return undefined
  }

  const value = codec.toLowerCase()
  if (value.includes("mp4a.40.2") || value.includes("aac lc")) {
    return "AAC LC"
  }
  if (value.includes("mp4a.40.5") || value.includes("he-aac") || value.includes("heaac")) {
    return "HE-AAC"
  }
  if (value.includes("aac")) {
    return "AAC"
  }
  if (value.includes("flac")) {
    return "FLAC"
  }
  if (value.includes("opus")) {
    return "OPUS"
  }
  if (value.includes("vorbis")) {
    return "VORBIS"
  }
  if (value.includes("alac")) {
    return "ALAC"
  }
  if (value.includes("mp3") || value.includes("mpeg")) {
    return "MP3"
  }

  const primary = codec.split(",")[0]?.trim()
  return primary ? primary.toUpperCase() : undefined
}

export function resolveAudioFormat(
  audioFormat: string | undefined,
  fileName: string,
  codecLabel?: string
): string {
  const value = (audioFormat || "").toLowerCase()
  if (value.includes("audio/mp4a-latm") || value.includes("audio/aac")) {
    return "AAC"
  }
  if (value.includes("audio/mpeg")) {
    return "MP3"
  }
  if (value.includes("audio/flac")) {
    return "FLAC"
  }
  if (value.includes("audio/ogg")) {
    return codecLabel?.includes("OPUS") ? "OPUS" : "OGG"
  }
  if (value.includes("audio/wav") || value.includes("audio/x-wav")) {
    return "WAV"
  }
  if (value.includes("audio/mp4")) {
    return "MP4"
  }
  if (value.includes("audio/")) {
    const mimeLabel = value.split("/")[1]?.trim()
    if (mimeLabel) {
      return mimeLabel.toUpperCase()
    }
  }

  const extension = fileName.split(".").pop()?.trim()
  if (extension) {
    return extension.toUpperCase()
  }

  return "Unknown"
}

export function formatQualityLabel(
  sampleRate: number | undefined,
  bitrate: number | undefined
): string {
  const segments: string[] = []

  if (sampleRate && Number.isFinite(sampleRate) && sampleRate > 0) {
    const khz = sampleRate / 1000
    segments.push(`${Number.isInteger(khz) ? khz.toFixed(0) : khz.toFixed(1)}KHZ`)
  }

  if (bitrate && Number.isFinite(bitrate) && bitrate > 0) {
    const kbps = bitrate >= 10_000 ? Math.round(bitrate / 1000) : Math.round(bitrate)
    if (kbps > 0) {
      segments.push(`${kbps}KBPS`)
    }
  }

  return segments.length > 0 ? segments.join(" ") : "Unknown"
}
