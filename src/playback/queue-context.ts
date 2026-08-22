import type { PlaybackQueueContext, PlayerTrack } from "./types"

export function buildPlaybackQueue(tracks: PlayerTrack[], selectedTrackId: string) {
  const selectedTrackIndex = tracks.findIndex((track) => track.id === selectedTrackId)
  const currentTrackIndex = selectedTrackIndex >= 0 ? selectedTrackIndex : 0
  const queue = tracks.slice(currentTrackIndex).concat(tracks.slice(0, currentTrackIndex))

  return {
    queue,
    queueTrackIds: queue.map((track) => track.id),
  }
}

export function allTracksShareValue(
  tracks: PlayerTrack[],
  getValue: (track: PlayerTrack) => string | undefined
) {
  const values = tracks
    .map((track) => getValue(track)?.trim())
    .filter((value): value is string => Boolean(value))

  if (values.length !== tracks.length || values.length === 0) {
    return false
  }

  const firstValue = values[0]
  if (!firstValue) {
    return false
  }

  return values.every((value) => value.toLowerCase() === firstValue.toLowerCase())
}

export function inferQueueContext(
  track: PlayerTrack,
  tracks: PlayerTrack[],
  providedContext?: PlaybackQueueContext
): PlaybackQueueContext | null {
  const providedTitle = providedContext?.title.trim()
  if (providedContext && providedTitle) {
    return { ...providedContext, title: providedTitle }
  }

  if (track.isExternal) {
    return { type: "external", title: track.title }
  }

  if (
    track.album?.trim() &&
    (allTracksShareValue(tracks, (item) => item.albumId) ||
      allTracksShareValue(tracks, (item) => item.album))
  ) {
    return { type: "album", title: track.album.trim() }
  }

  if (
    track.artist?.trim() &&
    (allTracksShareValue(tracks, (item) => item.artistId) ||
      allTracksShareValue(tracks, (item) => item.artist))
  ) {
    return { type: "artist", title: track.artist.trim() }
  }

  return null
}
