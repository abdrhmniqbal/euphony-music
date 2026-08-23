export function formatDurationVerbose(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }
  return `${minutes}m ${seconds}s`
}

export function formatDurationCompact(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) {
    return `${total}s`
  }
  const minutes = Math.floor(total / 60)
  const remainder = total % 60
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`
}
