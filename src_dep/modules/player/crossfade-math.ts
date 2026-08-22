/**
 * Purpose: Pure crossfade volume math — clamping, easing, and fade-duration derivation.
 * Caller: Player crossfade runtime (setPlayerVolume, startVolumeRamp, handleCrossfadeProgress).
 * Dependencies: none.
 * Main Functions: clampVolume(), easeInOutCubic(), getFadeDurationSeconds()
 * Side Effects: None.
 */

export const FULL_VOLUME = 1
export const SILENT_VOLUME = 0
export const MIN_FADE_SECONDS = 0.75

export function clampVolume(value: number) {
  if (!Number.isFinite(value)) {
    return FULL_VOLUME
  }

  return Math.max(SILENT_VOLUME, Math.min(FULL_VOLUME, value))
}

export function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

export function getFadeDurationSeconds(duration: number, requestedSeconds: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return requestedSeconds
  }

  return Math.max(
    MIN_FADE_SECONDS,
    Math.min(requestedSeconds, Math.max(MIN_FADE_SECONDS, duration / 2))
  )
}
