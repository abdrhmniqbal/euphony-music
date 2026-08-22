import type { TrackDurationFilterConfig } from "@/core/preferences/types"

export function getTrackDurationMinimumSeconds(config: TrackDurationFilterConfig): number {
  if (config.mode === "min30s") {
    return 30
  }

  if (config.mode === "min60s") {
    return 60
  }

  if (config.mode === "min120s") {
    return 120
  }

  if (config.mode === "custom") {
    if (!Number.isFinite(config.customMinimumSeconds)) {
      return 180
    }
    return Math.max(0, Math.min(1200, Math.round(config.customMinimumSeconds)))
  }

  return 0
}

export function isAssetAllowedByTrackDuration(
  durationSeconds: number,
  config: TrackDurationFilterConfig
): boolean {
  const minDuration = getTrackDurationMinimumSeconds(config)
  if (minDuration <= 0) {
    return true
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return false
  }

  return durationSeconds >= minDuration
}
