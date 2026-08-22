/**
 * Purpose: Canonical visual identity primitives shared across mixes, genres, and any card-based pattern+color system.
 */

import type { Track } from "@/modules/player/types"

/**
 * Collect unique artwork images from a list of tracks, deduped and capped at `maxCount`.
 * Shared by MixCard and CollectionActionSheet for mix/playlist artwork grid generation.
 */
export function collectTrackImages(tracks: Track[], maxCount = 4): string[] {
  const images = new Set<string>()

  for (const track of tracks) {
    if (track.image) {
      images.add(track.image)
    }

    if (images.size >= maxCount) {
      break
    }
  }

  return Array.from(images)
}

export const SHAPES = [
  "circles",
  "waves",
  "grid",
  "diamonds",
  "triangles",
  "rings",
  "pills",
  "stripes",
  "stars",
  "zigzag",
  "crosses",
] as const

export type Shape = (typeof SHAPES)[number]

export const COLOR_COUNT = 10

/** Canonical color identifiers — same pool used by both genres and mixes. */
export const COLORS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

export type ColorId = (typeof COLORS)[number]

export interface VisualIdentity {
  colorIndex: number
  shape: Shape
}

/**
 * Pick a visual identity from a seed.
 * When `reserved` is provided BOTH colorIndex AND shape must differ.
 */
export function pickVisual(seed: number, reserved?: VisualIdentity): VisualIdentity {
  const baseColorIndex = Math.abs(seed) % COLOR_COUNT
  const baseShapeIndex = Math.abs(seed) % SHAPES.length

  if (!reserved) {
    return { colorIndex: baseColorIndex, shape: SHAPES[baseShapeIndex] }
  }

  for (let offset = 0; offset < Math.max(COLOR_COUNT, SHAPES.length); offset++) {
    const colorIndex = (baseColorIndex + offset) % COLOR_COUNT
    const shape = SHAPES[(baseShapeIndex + offset) % SHAPES.length]

    if (colorIndex !== reserved.colorIndex && shape !== reserved.shape) {
      return { colorIndex, shape }
    }
  }

  return { colorIndex: baseColorIndex, shape: SHAPES[baseShapeIndex] }
}
