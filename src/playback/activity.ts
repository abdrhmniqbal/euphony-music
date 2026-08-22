import type { PlayerTrack } from "./types"

/**
 * Records a track activation into listening history and play-count metrics.
 * The play count + history row are written by the playback listener after the
 * configured count-as-played threshold; this hook exists for future
 * activation-time bookkeeping (e.g. scrobbling start events).
 */
export async function handleTrackActivated(_track: PlayerTrack) {
  // Activity tracking placeholder
}
