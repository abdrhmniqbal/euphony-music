import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"
import { logError, logInfo } from "@/modules/logging/service"

import { invalidatePlaylistQueries } from "./keys"
import { addTrackToPlaylist, removeTrackFromPlaylist } from "./repository"

export interface SelectTrackPlaylistInput {
  playlistId: string
  trackId: string
  hasTrack: boolean
}

type SelectTrackPlaylistMutationResult =
  | { status: "removed"; playlistId: string; trackId: string }
  | { status: "added"; playlistId: string; trackId: string }
  | { status: "already-in-playlist"; playlistId: string; trackId: string }

export type SelectTrackPlaylistResult =
  | { status: "busy" }
  | { status: "removed" }
  | { status: "added" }
  | { status: "already-in-playlist" }
  | { status: "failed" }

export function useSelectTrackPlaylist() {
  const selectTrackPlaylistMutation = useMutation(
    {
      mutationFn: async (
        variables: SelectTrackPlaylistInput
      ): Promise<SelectTrackPlaylistMutationResult> => {
        const { hasTrack, playlistId, trackId } = variables

        if (hasTrack) {
          logInfo("Removing track from playlist", { playlistId, trackId })
          await removeTrackFromPlaylist({ playlistId, trackId })
          return { status: "removed", playlistId, trackId }
        }

        logInfo("Adding track to playlist", { playlistId, trackId })
        const result = await addTrackToPlaylist({ playlistId, trackId })

        if (result.skipped) {
          return { status: "already-in-playlist", playlistId, trackId }
        }

        return { status: "added", playlistId, trackId }
      },
      onSuccess: async (result) => {
        await invalidatePlaylistQueries(queryClient, {
          playlistId: result.playlistId,
          trackId: result.trackId,
        })
      },
      onError: (error, variables) => {
        logError("Failed to update track playlist selection", error, {
          playlistId: variables.playlistId,
          trackId: variables.trackId,
          hasTrack: variables.hasTrack,
        })
      },
    },
    queryClient
  )

  async function selectTrackPlaylist(
    variables: SelectTrackPlaylistInput
  ): Promise<SelectTrackPlaylistResult> {
    if (selectTrackPlaylistMutation.isPending) {
      return { status: "busy" }
    }

    try {
      const result = await selectTrackPlaylistMutation.mutateAsync(variables)
      return { status: result.status }
    } catch {
      return { status: "failed" }
    }
  }

  return {
    isSelecting: selectTrackPlaylistMutation.isPending,
    selectTrackPlaylist,
  }
}
