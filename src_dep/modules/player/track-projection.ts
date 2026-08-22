import type { SplitMultipleValueConfig } from "@/modules/settings/types"
import { formatArtistsForDisplay, splitArtistsValue } from "@/modules/settings/split-multiple-values"
import type { Track as DataTrack } from "@/modules/tracks/types"
import type { Track as PlayerTrack } from "@/modules/player/types"

// Pure projection from the canonical DataTrack (DB shape) to the player-domain
// Track used by the legacy UI read-model. Kept free of store/native imports so
// it can be unit-tested and reused when the two playback stores are collapsed.
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
    artistId: track.artistName ?? undefined,
    album: track.albumName ?? undefined,
    albumId: track.albumId ?? undefined,
    duration: track.duration,
    uri: track.uri,
    image: track.artwork ?? undefined,
    isExternal: false,
    isDeleted: false,
    artistName,
    albumName: track.albumName,
    artwork: track.artwork,
    artists: track.artists,
    rawArtistName: track.rawArtistName,
  }
}
