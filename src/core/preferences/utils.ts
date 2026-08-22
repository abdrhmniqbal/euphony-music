import { clamp } from "@/lib/number"

export function clampMinAlbumLength(value: number) {
  return clamp(1, value, 20)
}

export function clampPlaybackDelay(value: number) {
  return clamp(0, value, 10)
}
