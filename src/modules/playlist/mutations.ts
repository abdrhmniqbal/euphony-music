import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"
import { invalidateFavoriteQueries } from "@/modules/favorites/keys"
import { i18n } from "@/modules/localization/i18n"
import { logError, logInfo } from "@/modules/logging/service"
import { showAppToast } from "@/modules/ui/toast"

import { invalidatePlaylistQueries } from "./keys"
import {
  deletePlaylist,
  removeTrackFromPlaylist,
} from "./repository"

type PlaylistTrackVariables = {
  playlistId: string
  trackId: string
}

type RemoveTrackFromPlaylistResult = Awaited<ReturnType<typeof removeTrackFromPlaylist>>

export function useDeletePlaylist() {
  return useMutation<void, unknown, string>(
    {
      mutationFn: async (playlistId: string) => {
        logInfo("Deleting playlist", { playlistId })
        return deletePlaylist(playlistId)
      },
      onSuccess: async (_result, deletedPlaylistId) => {
        logInfo("Deleted playlist", { playlistId: deletedPlaylistId })
        showAppToast(i18n.t("common.feedback.playlistDeleted"))
        await Promise.all([
          invalidatePlaylistQueries(queryClient, {
            playlistId: deletedPlaylistId,
          }),
          invalidateFavoriteQueries(queryClient),
        ])
      },
      onError: (error, deletedPlaylistId) => {
        logError("Failed to delete playlist", error, {
          playlistId: deletedPlaylistId,
        })
        showAppToast(i18n.t("common.feedback.failedToDeletePlaylist"))
      },
    },
    queryClient
  )
}

export function useRemoveTrackFromPlaylist() {
  return useMutation<RemoveTrackFromPlaylistResult, unknown, PlaylistTrackVariables>(
    {
      mutationFn: async (variables: PlaylistTrackVariables) => {
        logInfo("Removing track from playlist", variables)
        return removeTrackFromPlaylist(variables)
      },
      onSuccess: async (_result, variables) => {
        logInfo("Removed track from playlist", variables)
        showAppToast(i18n.t("common.feedback.removedFromPlaylist"))
        await invalidatePlaylistQueries(queryClient, {
          playlistId: variables.playlistId,
          trackId: variables.trackId,
        })
      },
      onError: (error, variables) => {
        logError("Failed to remove track from playlist", error, variables)
        showAppToast(i18n.t("common.feedback.failedToRemoveFromPlaylist"))
      },
    },
    queryClient
  )
}


