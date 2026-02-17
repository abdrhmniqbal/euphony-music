export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

export function formatTrackCount(count: number): string {
  return `${count} ${count === 1 ? "track" : "tracks"}`
}
