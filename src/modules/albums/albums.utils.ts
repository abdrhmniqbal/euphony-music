import type { Track } from "@/modules/player/player.types"

export function formatAlbumDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

export function sortTracksByDiscAndTrack(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    const discA = a.discNumber || 1
    const discB = b.discNumber || 1

    if (discA !== discB) {
      return discA - discB
    }

    const trackA = a.trackNumber || 0
    const trackB = b.trackNumber || 0

    if (trackA !== trackB) {
      return trackA - trackB
    }

    return a.title.localeCompare(b.title)
  })
}

export function groupTracksByDisc(tracks: Track[]): Map<number, Track[]> {
  const groups = new Map<number, Track[]>()

  for (const track of tracks) {
    const discNumber = track.discNumber || 1
    if (!groups.has(discNumber)) {
      groups.set(discNumber, [])
    }
    groups.get(discNumber)!.push(track)
  }

  return groups
}
