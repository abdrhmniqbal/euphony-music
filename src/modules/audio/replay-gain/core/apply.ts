import type { Track } from "@/modules/tracks/types"
import { getSettingsState } from "@/modules/settings/store"
import {
  formatArtistsForDisplay,
  splitArtistsValue,
} from "@/modules/settings/split-multiple-values"

export async function applyReplayGainToTrack(track: Track, _apply = true) {
  let displayArtist = track.rawArtistName || track.artistName || undefined

  if (track.rawArtistName || track.artistName) {
    const rawArtist = track.rawArtistName || track.artistName || ""
    const splitConfig = getSettingsState().splitMultipleValueConfig
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
