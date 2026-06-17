import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"
import { invalidateFavoriteQueries } from "@/modules/favorites/keys"
import { logError, logInfo } from "@/modules/logging/service"

import { invalidatePlaylistQueries } from "./keys"
import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  updatePlaylistMetadata,
} from "./repository"

type CreatePlaylistVariables = {
  name: string
  description?: string
  trackIds: string[]
}

type UpdatePlaylistVariables = {
  id: string
  name?: string
  description?: string
}

type PlaylistTrackVariables = {
  playlistId: string
  trackId: string
}

type ReorderPlaylistTracksVariables = {
  playlistId: string
  trackIds: string[]
}

type AddTrackToPlaylistResult = Awaited<ReturnType<typeof addTrackToPlaylist>>
type RemoveTrackFromPlaylistResult = Awaited<
  ReturnType<typeof removeTrackFromPlaylist>
>

export function useCreatePlaylist() {
  return useMutation<void, unknown, CreatePlaylistVariables>(
    {
      mutationFn: async ({
        name,
        description,
        trackIds,
      }: CreatePlaylistVariables) => {
        logInfo("Creating playlist", {
          name,
          trackCount: trackIds.length,
        })
        await createPlaylist(name, description, trackIds)
      },
      onSuccess: async (_result, variables) => {
        logInfo("Created playlist", {
          name: variables.name,
          trackCount: variables.trackIds.length,
        })
        await invalidatePlaylistQueries(queryClient)
      },
      onError: (error, variables) => {
        logError("Failed to create playlist", error, {
          name: variables.name,
          trackCount: variables.trackIds.length,
        })
      },
    },
    queryClient
  )
}

export function useUpdatePlaylist() {
  return useMutation<void, unknown, UpdatePlaylistVariables>(
    {
      mutationFn: async ({
        id,
        name,
        description,
      }: UpdatePlaylistVariables) => {
        logInfo("Updating playlist metadata", {
          playlistId: id,
          hasName: typeof name === "string",
          hasDescription: typeof description === "string",
        })
        await updatePlaylistMetadata({ id, name, description })
      },
      onSuccess: async (_result, variables) => {
        logInfo("Updated playlist metadata", {
          playlistId: variables.id,
        })
        await invalidatePlaylistQueries(queryClient, {
          playlistId: variables.id,
        })
      },
      onError: (error, variables) => {
        logError("Failed to update playlist metadata", error, {
          playlistId: variables.id,
        })
      },
    },
    queryClient
  )
}

export function useDeletePlaylist() {
  return useMutation<void, unknown, string>(
    {
      mutationFn: async (playlistId: string) => {
        logInfo("Deleting playlist", { playlistId })
        return deletePlaylist(playlistId)
      },
      onSuccess: async (_result, deletedPlaylistId) => {
        logInfo("Deleted playlist", { playlistId: deletedPlaylistId })
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
      },
    },
    queryClient
  )
}

export function useAddTrackToPlaylist() {
  return useMutation<
    AddTrackToPlaylistResult,
    unknown,
    PlaylistTrackVariables
  >(
    {
      mutationFn: async (variables: PlaylistTrackVariables) => {
        logInfo("Adding track to playlist", variables)
        return addTrackToPlaylist(variables)
      },
      onSuccess: async (_result, variables) => {
        logInfo("Added track to playlist", variables)
        await invalidatePlaylistQueries(queryClient, {
          playlistId: variables.playlistId,
          trackId: variables.trackId,
        })
      },
      onError: (error, variables) => {
        logError("Failed to add track to playlist", error, variables)
      },
    },
    queryClient
  )
}

export function useRemoveTrackFromPlaylist() {
  return useMutation<
    RemoveTrackFromPlaylistResult,
    unknown,
    PlaylistTrackVariables
  >(
    {
      mutationFn: async (variables: PlaylistTrackVariables) => {
        logInfo("Removing track from playlist", variables)
        return removeTrackFromPlaylist(variables)
      },
      onSuccess: async (_result, variables) => {
        logInfo("Removed track from playlist", variables)
        await invalidatePlaylistQueries(queryClient, {
          playlistId: variables.playlistId,
          trackId: variables.trackId,
        })
      },
      onError: (error, variables) => {
        logError("Failed to remove track from playlist", error, variables)
      },
    },
    queryClient
  )
}

export function useReorderPlaylistTracks() {
  return useMutation<void, unknown, ReorderPlaylistTracksVariables>(
    {
      mutationFn: async (variables: ReorderPlaylistTracksVariables) => {
        logInfo("Reordering playlist tracks", {
          playlistId: variables.playlistId,
          trackCount: variables.trackIds.length,
        })
        return reorderPlaylistTracks(variables)
      },
      onSuccess: async (_result, variables) => {
        logInfo("Reordered playlist tracks", {
          playlistId: variables.playlistId,
          trackCount: variables.trackIds.length,
        })
        await invalidatePlaylistQueries(queryClient, {
          playlistId: variables.playlistId,
        })
      },
      onError: (error, variables) => {
        logError("Failed to reorder playlist tracks", error, {
          playlistId: variables.playlistId,
          trackCount: variables.trackIds.length,
        })
      },
    },
    queryClient
  )
}
