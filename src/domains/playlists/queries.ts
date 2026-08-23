import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { i18n } from "@/core/localization/i18n"
import { logError, logInfo } from "@/core/log/service"
import { showAppToast } from "@/core/ui/toast"
import { queryClient } from "@/core/query/query-client"
import {
  PLAYLISTS_KEY,
  FAVORITES_KEY,
  TRACKS_KEY,
  ALBUMS_KEY,
  ARTISTS_KEY,
} from "@/domains/library/query-keys"

import {
  addTracksToPlaylist,
  createPlaylist as createPlaylistViaRepo,
  deletePlaylist,
  getPlaylistById,
  listPlaylists,
  listPlaylistsForTrack,
  removeTrackFromPlaylist,
  updatePlaylist as updatePlaylistViaRepo,
} from "./repository"

export const playlistKeys = {
  all: [PLAYLISTS_KEY] as const,
  detail: (id: string) => [PLAYLISTS_KEY, id] as const,
  membership: (trackId: string) => [PLAYLISTS_KEY, "membership", trackId] as const,
}

export function invalidatePlaylistQueries(
  client: ReturnType<typeof useQueryClient>,
  options: { playlistId?: string | null } = {}
) {
  return Promise.all([
    client.invalidateQueries({ queryKey: playlistKeys.all }),
    ...(options.playlistId
      ? [client.invalidateQueries({ queryKey: playlistKeys.detail(options.playlistId) })]
      : []),
  ])
}

export function usePlaylistsWithOptions(enabled: boolean) {
  return useQuery({
    queryKey: playlistKeys.all,
    enabled,
    placeholderData: (previousData) => previousData,
    queryFn: listPlaylists,
  })
}

export function usePlaylistsForTrack(trackId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: playlistKeys.membership(trackId ?? ""),
    enabled,
    placeholderData: (previousData) => previousData,
    queryFn: async () => await listPlaylistsForTrack(trackId),
  })
}

export function usePlaylist(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: playlistKeys.detail(id),
    enabled: enabled && id.length > 0,
    queryFn: async () => await getPlaylistById(id),
  })
}

export function useDeletePlaylist() {
  return useMutation<void, unknown, string>({
    mutationFn: async (playlistId: string) => {
      logInfo("Deleting playlist", { playlistId })
      return deletePlaylist(playlistId)
    },
    onSuccess: async (_result, deletedPlaylistId) => {
      logInfo("Deleted playlist", { playlistId: deletedPlaylistId })
      showAppToast(i18n.t("common.feedback.playlistDeleted"))
      await Promise.all([
        invalidatePlaylistQueries(queryClient, { playlistId: deletedPlaylistId }),
        queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] }),
      ])
    },
    onError: (error, deletedPlaylistId) => {
      logError("Failed to delete playlist", error, { playlistId: deletedPlaylistId })
      showAppToast(i18n.t("common.feedback.failedToDeletePlaylist"))
    },
  })
}

export function useRemoveTrackFromPlaylist() {
  return useMutation<{ playlistId: string; trackId: string }, unknown, { playlistId: string; trackId: string }>({
    mutationFn: async (variables) => {
      logInfo("Removing track from playlist", variables)
      return removeTrackFromPlaylist(variables)
    },
    onSuccess: async (_result, variables) => {
      logInfo("Removed track from playlist", variables)
      showAppToast(i18n.t("common.feedback.removedFromPlaylist"))
      await invalidatePlaylistQueries(queryClient, { playlistId: variables.playlistId })
    },
    onError: (error, variables) => {
      logError("Failed to remove track from playlist", error, variables)
      showAppToast(i18n.t("common.feedback.failedToRemoveFromPlaylist"))
    },
  })
}

export function useSavePlaylist(isEditMode: boolean) {
  return useMutation<
    void,
    unknown,
    { id?: string; name: string; description?: string; trackIds: string[] }
  >({
    mutationFn: async (payload) => {
      if (payload.id) {
        await updatePlaylistViaRepo(payload.id, payload.name, payload.description, payload.trackIds)
        return
      }

      await createPlaylistViaRepo(payload.name, payload.description, payload.trackIds)
    },
    onSuccess: async (_result, variables) => {
      showAppToast(
        isEditMode
          ? i18n.t("common.feedback.playlistUpdated")
          : i18n.t("common.feedback.playlistCreated"),
        variables.name
      )
      await Promise.all([
        invalidatePlaylistQueries(queryClient, { playlistId: isEditMode ? (variables.id ?? null) : null }),
        queryClient.invalidateQueries({ queryKey: [TRACKS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ALBUMS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ARTISTS_KEY] }),
      ])
    },
    onError: (_error, variables) => {
      showAppToast(
        isEditMode
          ? i18n.t("common.feedback.failedToUpdatePlaylist")
          : i18n.t("common.feedback.failedToCreatePlaylist"),
        variables.name
      )
    },
  })
}

export function useAddTracksToPlaylist() {
  return useMutation<{ playlistId: string; added: number }, unknown, { playlistId: string; trackIds: string[] }>({
    mutationFn: async (variables) => {
      logInfo("Adding tracks to playlist", { ...variables })
      return addTracksToPlaylist(variables)
    },
    onSuccess: async (_result, variables) => {
      await invalidatePlaylistQueries(queryClient, { playlistId: variables.playlistId })
    },
    onError: (error, variables) => {
      logError("Failed to add tracks to playlist", error, variables)
    },
  })
}
