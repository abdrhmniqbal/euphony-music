export function hasMoreThanOneDistinctTime(values: number[]) {
  const distinctValues = new Set(
    values.filter((value) => Number.isFinite(value)).map((value) => Math.round(value * 1000))
  )
  return distinctValues.size > 1
}

export function parseTimedMarkupTimestamp(raw: string): number {
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
