import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import * as React from "react"

import type { Track } from "@/modules/player/types"
import { queryClient } from "@/lib/tanstack-query"
import { i18n } from "@/modules/localization/i18n"
import { logError } from "@/modules/logging/service"
import { showAppToast } from "@/modules/ui/toast"
import { getAllTracks } from "@/modules/player/repository"

import { buildSelectedTracksList, reorderTrackIds } from "./form"
import { invalidatePlaylistQueries } from "./keys"
import { createPlaylist, updatePlaylist } from "./repository"
import { clampPlaylistDescription, clampPlaylistName } from "./utils"
import { useTrackPickerDraft } from "./use-track-picker-draft"

const LIBRARY_TRACKS_QUERY_KEY = ["library", "tracks"] as const

interface PlaylistFormPayload {
  id?: string
  name: string
  description?: string
  trackIds: string[]
}

interface UsePlaylistFormEditorOptions {
  playlistId?: string
  initialName: string
  initialDescription: string
  initialSelectedTrackIds: string[]
  isEditMode: boolean
  onSaved: () => void
}

export function usePlaylistFormEditor({
  playlistId,
  initialName,
  initialDescription,
  initialSelectedTrackIds,
  isEditMode,
  onSaved,
}: UsePlaylistFormEditorOptions) {
  const [selectedTrackIds, setSelectedTrackIds] = React.useState<string[]>(
    () => initialSelectedTrackIds
  )

  const savePlaylistMutation = useMutation(
    {
      mutationFn: async (payload: PlaylistFormPayload) => {
        if (payload.id) {
          await updatePlaylist(payload.id, payload.name, payload.description, payload.trackIds)
          return
        }

        await createPlaylist(payload.name, payload.description, payload.trackIds)
      },
      onSuccess: async (_result, variables) => {
        showAppToast(
          isEditMode
            ? i18n.t("common.feedback.playlistUpdated")
            : i18n.t("common.feedback.playlistCreated"),
          variables.name
        )
        await invalidatePlaylistQueries(queryClient, {
          playlistId: isEditMode ? (playlistId ?? null) : null,
        })
      },
      onError: (_error, variables) => {
        showAppToast(
          isEditMode
            ? i18n.t("common.feedback.failedToUpdatePlaylist")
            : i18n.t("common.feedback.failedToCreatePlaylist"),
          variables.name
        )
      },
    },
    queryClient
  )

  const form = useForm({
    defaultValues: {
      name: clampPlaylistName(initialName),
      description: clampPlaylistDescription(initialDescription),
    },
    validators: {
      onChange: ({ value }) => {
        if (!value.name.trim()) {
          return { name: "Required" }
        }
        return
      },
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim()
      if (!name || savePlaylistMutation.isPending) {
        return
      }

      try {
        await savePlaylistMutation.mutateAsync({
          id: isEditMode ? playlistId : undefined,
          name,
          description: value.description.trim().length > 0 ? value.description.trim() : undefined,
          trackIds: selectedTrackIds,
        })
        onSaved()
      } catch (error) {
        logError("Playlist form save failed", error, {
          playlistId: playlistId ?? null,
          isEditMode,
        })
      }
    },
  })

  const { data: allTracks = [] } = useQuery<Track[]>(
    {
      queryKey: LIBRARY_TRACKS_QUERY_KEY,
      queryFn: getAllTracks,
      enabled: true,
      staleTime: 5 * 60 * 1000,
      placeholderData: (previousData) => previousData,
    },
    queryClient
  )

  const picker = useTrackPickerDraft({
    allTracks,
    selectedTrackIds,
    setSelectedTrackIds,
  })

  const selectedTracksList = React.useMemo(
    () => buildSelectedTracksList(allTracks, selectedTrackIds),
    [allTracks, selectedTrackIds]
  )

  const toggleSelectedTrack = React.useCallback((trackId: string) => {
    setSelectedTrackIds((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId)
      }

      return [...prev, trackId]
    })
  }, [])

  const reorderSelectedTracks = React.useCallback((from: number, to: number) => {
    setSelectedTrackIds((prev) => reorderTrackIds(prev, from, to))
  }, [])

  return {
    form,
    selectedTracksList,
    toggleSelectedTrack,
    reorderSelectedTracks,
    ...picker,
  }
}
