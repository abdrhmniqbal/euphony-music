import type { DataTrack } from "@/domains/tracks/types"
import { getPreferenceState } from "@/core/preferences/store"

import { formatArtistsForDisplay, splitArtistsValue } from "@/domains/tracks/split-engine"

export interface NativeTrack {
  src: string
  artwork?: string
  title: string
  artist?: string
  album?: string
  duration: number
  replayGain: number
}

/**
 * Maps a library track onto the native player's track shape.
 * ReplayGain analysis is deferred to the integrations phase; the field stays
 * in the contract so native loading code does not change when it lands.
 */
export function toNativeTrack(track: DataTrack): NativeTrack {
  let displayArtist = track.rawArtistName || track.artistName || undefined

  if (track.rawArtistName || track.artistName) {
    const rawArtist = track.rawArtistName || track.artistName || ""
    const splitConfig = getPreferenceState().splitMultipleValueConfig
    const artistNames = splitArtistsValue(rawArtist, splitConfig)
    displayArtist = formatArtistsForDisplay(rawArtist, artistNames, splitConfig.artistSplitMode)
  }

  return {
    src: track.uri,
    artwork: track.artwork ?? undefined,
    title: track.name,
    artist: displayArtist,
    album: track.albumName ?? undefined,
    duration: track.duration,
    replayGain: 0,
  }
}
