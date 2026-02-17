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

export const GENRE_COLORS = [
  "bg-rainbow-lime",
  "bg-rainbow-teal",
  "bg-rainbow-cyan",
  "bg-rainbow-blue",
  "bg-rainbow-indigo",
  "bg-rainbow-purple",
  "bg-rainbow-magenta",
  "bg-rainbow-red",
  "bg-rainbow-orange",
  "bg-rainbow-amber",
] as const

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
