export type GenreShape =
  | "circles"
  | "waves"
  | "grid"
  | "diamonds"
  | "triangles"
  | "rings"
  | "pills"
  | "stripes"
  | "stars"
  | "zigzag"
  | "crosses"

export const GENRE_COLORS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

export const GENRE_SHAPES: readonly GenreShape[] = [
  "circles",
  "waves",
  "diamonds",
  "triangles",
  "rings",
  "grid",
  "pills",
  "stripes",
  "stars",
  "zigzag",
  "crosses",
] as const

export function hashGenreName(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getGenreRainbowColor(name: string): string {
  const hash = hashGenreName(name)
  return GENRE_COLORS[hash % GENRE_COLORS.length]
}

export function getGenreShape(name: string): GenreShape {
  const hash = hashGenreName(name)
  return GENRE_SHAPES[Math.floor(hash / GENRE_COLORS.length) % GENRE_SHAPES.length]
}
