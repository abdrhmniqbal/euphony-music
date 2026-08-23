import type { SplitMultipleValueConfig } from "@/core/preferences/types"
import type { DataTrack } from "@/domains/tracks/types"
import { formatArtistsForDisplay, splitArtistsValue } from "@/domains/tracks/split-engine"

import type { PlayerTrack } from "./types"

// Pure projection from the canonical DataTrack (DB shape) to the player-domain
// Track used by the UI read-model. Kept free of store/native imports so it can
// be unit-tested and reused when the two playback stores are collapsed.
export function toPlayerTrack(
  track: DataTrack | undefined,
  splitConfig: SplitMultipleValueConfig
): PlayerTrack | null {
  if (!track) return null

  let artistName = track.rawArtistName || track.artistName || undefined
  if (track.rawArtistName || track.artistName) {
    const rawArtist = track.rawArtistName || track.artistName || ""
    const artistNames = splitArtistsValue(rawArtist, splitConfig)
    artistName = formatArtistsForDisplay(rawArtist, artistNames, splitConfig.artistSplitMode)
  }

  return {
    id: track.id,
    title: track.name,
    artist: artistName,
    album: track.albumName ?? undefined,
    albumId: track.albumId ?? undefined,
    duration: track.duration,
    uri: track.uri,
    image: track.artwork ?? undefined,
    isExternal: false,
    artists: track.artists ?? undefined,
    albumArtwork: track.artwork ?? undefined,
    artistName,
    albumName: track.albumName ?? undefined,
    rawArtistName: track.rawArtistName ?? undefined,
  }
}

export function toPlayerTracks(
  tracks: DataTrack[],
  splitConfig: SplitMultipleValueConfig
): PlayerTrack[] {
  return tracks
    .map((track) => toPlayerTrack(track, splitConfig))
    .filter((t): t is PlayerTrack => t !== null)
}
