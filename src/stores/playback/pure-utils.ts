import type { PlayFromSource } from "./types"

export function arePlaybackSourceEqual(
  source1: PlayFromSource | undefined,
  source2: PlayFromSource
) {
  if (!source1) return false
  const keys = Object.keys(source1) as Array<keyof PlayFromSource>
  return keys.every((key) => source1[key] === source2[key])
}

export function extractTrackId(key: string) {
  return key.split("__")[0]!
}
