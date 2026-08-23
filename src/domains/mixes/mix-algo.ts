import { SHAPES, pickVisual, type Shape, type VisualIdentity } from "@/domains/visuals/shared"

export type MixShape = Shape
export { SHAPES as MIX_SHAPES, pickVisual as getMixVisual }

export interface MixCandidate {
  id: string
  artist?: string
  genres: string[]
  playCount?: number
}

type MixProfile = {
  artistNames: string[]
  genreNames: string[]
}

export function shuffle<T>(items: T[], seed = Date.now()) {
  const next = [...items]
  let currentSeed = seed

  for (let index = next.length - 1; index > 0; index -= 1) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    const swapIndex = Math.floor((currentSeed / 233280) * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

export function getDaySeed(now = new Date()) {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
}

export function getWeekSeed(now = new Date()) {
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const dayOffset = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
  const weekNumber = Math.floor(dayOffset / 7)
  return now.getFullYear() * 100 + weekNumber
}

export function getStartOfNextLocalDay(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime()
}

export function getStartOfNextLocalWeek(now = new Date()) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfWeek = startOfDay.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  startOfDay.setDate(startOfDay.getDate() - mondayOffset + 7)
  return startOfDay.getTime()
}

export function toMixShape(shape: string): MixShape {
  return SHAPES.includes(shape as MixShape) ? (shape as MixShape) : "circles"
}

export function buildProfile(sourceCandidates: MixCandidate[]): MixProfile {
  const artistCounts = new Map<string, number>()
  const genreCounts = new Map<string, number>()

  for (const candidate of sourceCandidates) {
    if (candidate.artist) {
      artistCounts.set(candidate.artist, (artistCounts.get(candidate.artist) ?? 0) + 1)
    }

    for (const genre of candidate.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
    }
  }

  return {
    artistNames: [...artistCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name),
    genreNames: [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name),
  }
}

export function scoreTrack(candidate: MixCandidate, profile: MixProfile) {
  let score = 0

  if (candidate.artist && profile.artistNames.includes(candidate.artist)) {
    score += 4
  }

  for (const genre of candidate.genres) {
    if (profile.genreNames.includes(genre)) {
      score += 2
    }
  }

  score += Math.min(candidate.playCount ?? 0, 10) * 0.15
  return score
}
