import type { PlayerTrack } from "@/playback/types"

export const MAX_PLAYLIST_NAME_LENGTH = 20
export const MAX_PLAYLIST_DESCRIPTION_LENGTH = 40

export interface PlaylistSummary {
  id: string
  name: string
  trackCount: number
  artwork: string | null
  images?: string[]
}

export function clampPlaylistName(value: string): string {
  return value.slice(0, MAX_PLAYLIST_NAME_LENGTH)
}

export function clampPlaylistDescription(value: string): string {
  return value.slice(0, MAX_PLAYLIST_DESCRIPTION_LENGTH)
}

export function toggleTrackSelection(current: Set<string>, trackId: string): Set<string> {
  const next = new Set(current)

  if (next.has(trackId)) {
    next.delete(trackId)
  } else {
    next.add(trackId)
  }

  return next
}

export function reorderTrackIds(ids: string[], from: number, to: number): string[] {
  if (from < 0 || to < 0 || from >= ids.length || to >= ids.length || from === to) {
    return ids
  }

  const next = [...ids]
  const [moved] = next.splice(from, 1)
  if (!moved) {
    return ids
  }

  next.splice(to, 0, moved)
  return next
}

export interface PlaylistDetailTrack extends PlayerTrack {
  playlistAddedAt: number
  playlistPosition: number
}

const TRACK_PICKER_LIMIT = 20

function sortTrackPickerTracks(tracks: PlayerTrack[]): PlayerTrack[] {
  return [...tracks].sort((a, b) => {
    const aLastPlayed = a.lastPlayedAt ?? 0
    const bLastPlayed = b.lastPlayedAt ?? 0
    if (bLastPlayed !== aLastPlayed) {
      return bLastPlayed - aLastPlayed
    }

    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
  })
}

function mergeUniqueTracks(primary: PlayerTrack[], secondary: PlayerTrack[]): PlayerTrack[] {
  const merged = [...primary]
  const seen = new Set(primary.map((track) => track.id))

  for (const track of secondary) {
    if (seen.has(track.id)) {
      continue
    }

    merged.push(track)
    seen.add(track.id)
  }

  return merged
}

export function buildSelectedTracksList(
  allTracks: PlayerTrack[],
  selectedTrackIds: string[]
): PlayerTrack[] {
  const tracksById = new Map(allTracks.map((track) => [track.id, track]))

  return selectedTrackIds
    .map((id) => tracksById.get(id))
    .filter((track): track is PlayerTrack => Boolean(track))
}

export function buildTrackPickerResults(options: {
  allTracks: PlayerTrack[]
  selectedTrackIds: string[]
  draftSelectedTracks: ReadonlySet<string>
  normalizedQuery: string
}): PlayerTrack[] {
  const { allTracks, selectedTrackIds, draftSelectedTracks, normalizedQuery } = options

  const sortedTracks = sortTrackPickerTracks(allTracks)
  const tracksById = new Map(sortedTracks.map((track) => [track.id, track]))
  const persistedSelectedIds = selectedTrackIds.filter((id) => draftSelectedTracks.has(id))
  const persistedSelectedSet = new Set(persistedSelectedIds)
  const newlySelectedIds = sortedTracks
    .map((track) => track.id)
    .filter((id) => draftSelectedTracks.has(id) && !persistedSelectedSet.has(id))
  const selectedTopTracks = [...persistedSelectedIds, ...newlySelectedIds]
    .map((id) => tracksById.get(id))
    .filter((track): track is PlayerTrack => Boolean(track))
  const maxVisibleCount = Math.max(TRACK_PICKER_LIMIT, selectedTopTracks.length)

  if (normalizedQuery.length === 0) {
    const recentlyPlayedTracks = sortedTracks.filter((track) => (track.lastPlayedAt ?? 0) > 0)
    const remainingTracks = sortedTracks.filter((track) => (track.lastPlayedAt ?? 0) <= 0)
    const suggestedTracks =
      recentlyPlayedTracks.length >= TRACK_PICKER_LIMIT
        ? recentlyPlayedTracks.slice(0, TRACK_PICKER_LIMIT)
        : recentlyPlayedTracks.concat(
            remainingTracks.slice(0, TRACK_PICKER_LIMIT - recentlyPlayedTracks.length)
          )

    return mergeUniqueTracks(selectedTopTracks, suggestedTracks).slice(0, maxVisibleCount)
  }

  return sortedTracks
    .filter((track) => {
      const title = track.title.toLowerCase()
      const artist = (track.artist || "").toLowerCase()
      const album = (track.album || "").toLowerCase()

      return (
        title.includes(normalizedQuery) ||
        artist.includes(normalizedQuery) ||
        album.includes(normalizedQuery)
      )
    })
    .slice(0, TRACK_PICKER_LIMIT)
}
