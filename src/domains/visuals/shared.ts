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

export const COLORS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

export type ColorId = (typeof COLORS)[number]

export interface VisualIdentity {
  colorIndex: number
  shape: Shape
}

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

export function collectTrackImages(images: Array<string | null | undefined>, maxCount = 4): string[] {
  const collected = new Set<string>()

  for (const image of images) {
    if (image) {
      collected.add(image)
    }

    if (collected.size >= maxCount) {
      break
    }
  }

  return Array.from(collected)
}
