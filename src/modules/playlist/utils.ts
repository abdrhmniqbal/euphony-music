/**
 * Purpose: Provides playlist form limits and helpers for selection, artwork, duration, and track mapping.
 * Caller: Playlist routes, playlist form hooks, playlist detail screen, playlist picker flows.
 * Dependencies: player track types, database track types, database-to-player transformers.
 * Main Functions: toggleTrackSelection(), clampPlaylistName(), clampPlaylistDescription(), buildPlaylistTracks(), buildPlaylistImages(), getPlaylistDuration(), formatDuration()
 * Side Effects: None.
 */

import type { Track } from "@/modules/player/types"
import type { DBTrack } from "@/types/database"
import { transformDBTrackToTrack } from "@/utils/transformers"

export const MAX_PLAYLIST_NAME_LENGTH = 20
export const MAX_PLAYLIST_DESCRIPTION_LENGTH = 40

export function toggleTrackSelection(current: Set<string>, trackId: string): Set<string> {
  const next = new Set(current)

  if (next.has(trackId)) {
    next.delete(trackId)
  } else {
    next.add(trackId)
  }

  return next
}

export function clampPlaylistName(value: string): string {
  return value.slice(0, MAX_PLAYLIST_NAME_LENGTH)
}

export function clampPlaylistDescription(value: string): string {
  return value.slice(0, MAX_PLAYLIST_DESCRIPTION_LENGTH)
}

interface PlaylistTrackRelation {
  track: DBTrack | null
  addedAt?: number | null
  position?: number | null
}

interface PlaylistEntity {
  artwork?: string | null
  tracks?: PlaylistTrackRelation[]
}

export interface PlaylistDetailTrack extends Track {
  playlistAddedAt: number
  playlistPosition: number
}

export function buildPlaylistTracks(playlist?: PlaylistEntity | null): PlaylistDetailTrack[] {
  return (playlist?.tracks || [])
    .filter((playlistTrack): playlistTrack is PlaylistTrackRelation & { track: DBTrack } =>
      Boolean(playlistTrack.track)
    )
    .map((playlistTrack) => ({
      ...transformDBTrackToTrack(playlistTrack.track),
      playlistAddedAt: playlistTrack.addedAt ?? 0,
      playlistPosition: playlistTrack.position ?? 0,
    }))
}

export function buildPlaylistImages(
  playlist: PlaylistEntity | null | undefined,
  tracks: Track[]
): string[] {
  const images = new Set<string>()

  if (playlist?.artwork) {
    images.add(playlist.artwork)
  }

  for (const track of tracks) {
    if (track.image) {
      images.add(track.image)
    }

    if (images.size >= 4) {
      break
    }
  }

  return Array.from(images)
}

export function getPlaylistDuration(tracks: Track[]): number {
  return tracks.reduce((sum, track) => sum + (track.duration || 0), 0)
}

export { formatDurationVerbose as formatDuration } from "@/utils/format"
