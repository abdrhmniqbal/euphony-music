import type { Track } from "@/modules/player/types"
import { playTrack } from "@/modules/player/service"
import { handleScrollStart, handleScrollStop } from "@/modules/ui/store"

// --- Playback actions ---

interface PlaybackContext {
  type: "artist" | "album" | "playlist"
  title: string
}

export function usePlaybackActions(tracks: Track[], context: PlaybackContext) {
  function playAll() {
    if (tracks.length === 0) return
    playTrack(tracks[0], tracks, context)
  }

  function shuffle() {
    if (tracks.length === 0) return
    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks, context)
  }

  return { playAll, shuffle }
}

// --- Scroll handlers ---

export function useDetailScrollHandlers() {
  return {
    onScrollBeginDrag: handleScrollStart,
    onMomentumScrollEnd: handleScrollStop,
    onScrollEndDrag: handleScrollStop,
  }
}

// --- Sort label ---

interface SortOption {
  field: string
  label: string
}

export function resolveSortLabel<T extends SortOption>(
  options: T[],
  field: string,
  t: (key: string) => string
): string {
  const option = options.find((o) => o.field === field)
  return option ? t(option.label) : t("library.sort")
}
