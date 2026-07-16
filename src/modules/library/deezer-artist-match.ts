export function normalizeArtistName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim()
}

export type DeezerCandidate = { id: number; name: string; nb_fan?: number }

export function selectArtistCandidate(
  candidates: DeezerCandidate[],
  artistName: string
): DeezerCandidate | undefined {
  if (candidates.length === 0) {
    return undefined
  }

  const normalized = normalizeArtistName(artistName)
  const exactMatch = candidates.find((c) => c.name === artistName)
  const normalizedMatch = candidates.find((c) => normalizeArtistName(c.name) === normalized)
  return exactMatch ?? normalizedMatch ?? candidates[0]
}
