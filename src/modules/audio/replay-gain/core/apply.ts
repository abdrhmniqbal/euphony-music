import type { Track } from "@/modules/tracks/types"

export async function applyReplayGainToTrack(track: Track, _apply = true) {
  return {
    src: track.uri,
    artwork: track.artwork ?? undefined,
    title: track.name,
    artist: track.artistName ?? undefined,
    album: track.albumName ?? undefined,
    duration: track.duration,
    replayGain: 0,
  }
}
