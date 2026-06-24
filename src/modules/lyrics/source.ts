/**
 * Purpose: Resolves lyrics from nearby sidecar files or embedded track metadata with in-memory caching.
 * Caller: Player lyrics view.
 * Dependencies: expo-file-system File API and TextDecoder.
 * Main Functions: resolveTrackLyricsSource()
 * Side Effects: Reads sidecar lyric files from device storage.
 */

import { stripMalformedUtf16LyricsPrefix } from "@/modules/lyrics/prefix-normalization"

interface TrackLyricsSourceInput {
  lyrics?: string
}

export function resolveTrackLyricsSource(
  track: TrackLyricsSourceInput | null | undefined
): string | undefined {
  if (!track || !track.lyrics) {
    return undefined
  }

  const normalized = stripMalformedUtf16LyricsPrefix(track.lyrics).trim()
  return normalized.length > 0 ? normalized : undefined
}
