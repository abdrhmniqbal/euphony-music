import { useCallback } from "react"

import { useSelectTrackPlaylist } from "./track-selection.hook"
import type { PlaylistPickerSelection } from "./types"

interface UsePlaylistPickerSelectionOptions {
  trackId?: string | null
  onSelectionApplied: () => void
  showPlaylistToast: (title: string, description?: string) => void
}

export function usePlaylistPickerSelection({
  trackId,
  onSelectionApplied,
  showPlaylistToast,
}: UsePlaylistPickerSelectionOptions) {
  const { isSelecting, selectTrackPlaylist } = useSelectTrackPlaylist()

  const handleSelectPlaylist = useCallback(
    async ({ id, name, hasTrack }: PlaylistPickerSelection) => {
      if (!trackId || isSelecting) {
        return
      }

      const result = await selectTrackPlaylist({
        playlistId: id,
        trackId,
        hasTrack,
      })

      if (result.status === "busy") {
        return
      }

      if (result.status === "failed") {
        showPlaylistToast(
          hasTrack ? "Failed to remove track" : "Failed to add track"
        )
        return
      }

      onSelectionApplied()

      if (result.status === "already-in-playlist") {
        showPlaylistToast("Already in playlist", name)
        return
      }

      if (result.status === "removed") {
        showPlaylistToast("Removed from playlist", name)
        return
      }

      if (result.status === "added") {
        showPlaylistToast("Added to playlist", name)
      }
    },
    [isSelecting, onSelectionApplied, selectTrackPlaylist, showPlaylistToast, trackId]
  )

  return {
    isSelecting,
    handleSelectPlaylist,
  }
}