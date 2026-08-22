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
