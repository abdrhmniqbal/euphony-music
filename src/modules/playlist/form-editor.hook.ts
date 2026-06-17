import type { Track } from "@/modules/player/types"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useMutation, useQuery } from "@tanstack/react-query"
import * as React from "react"

import { queryClient } from "@/lib/tanstack-query"
import { logError } from "@/modules/logging/service"
import { getAllTracks } from "@/modules/player/repository"

import {
  buildSelectedTracksList,
  buildTrackPickerResults,
  reorderTrackIds,
} from "./form"
import { invalidatePlaylistQueries } from "./keys"
import { createPlaylist, updatePlaylist } from "./repository"
import {
  clampPlaylistDescription,
  clampPlaylistName,
  toggleTrackSelection,
} from "./utils"

const SEARCH_DEBOUNCE_MS = 140
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
  const [name, setName] = React.useState(() => clampPlaylistName(initialName))
  const [description, setDescription] = React.useState(() =>
    clampPlaylistDescription(initialDescription)
  )
  const [selectedTrackIds, setSelectedTrackIds] = React.useState<string[]>(
    () => initialSelectedTrackIds
  )
  const [draftSelectedTracks, setDraftSelectedTracks] = React.useState(
    () => new Set(initialSelectedTrackIds)
  )
  const [isTrackSheetOpen, setIsTrackSheetOpen] = React.useState(false)
  const [searchInputKey, setSearchInputKey] = React.useState(0)
  const [searchQuery, setSearchQuery] = React.useState("")

  const savePlaylistMutation = useMutation(
    {
      mutationFn: async (payload: PlaylistFormPayload) => {
        if (payload.id) {
          await updatePlaylist(
            payload.id,
            payload.name,
            payload.description,
            payload.trackIds
          )
          return
        }

        await createPlaylist(payload.name, payload.description, payload.trackIds)
      },
      onSuccess: async () => {
        await invalidatePlaylistQueries(queryClient, {
          playlistId: isEditMode ? playlistId ?? null : null,
        })
      },
    },
    queryClient
  )

  const { data: allTracks = [] } = useQuery<Track[]>(
    {
      queryKey: LIBRARY_TRACKS_QUERY_KEY,
      queryFn: getAllTracks,
      enabled: isTrackSheetOpen || isEditMode || selectedTrackIds.length > 0,
      staleTime: 5 * 60 * 1000,
      placeholderData: (previousData) => previousData,
    },
    queryClient
  )

  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, {
    wait: SEARCH_DEBOUNCE_MS,
  })
  const normalizedQuery = debouncedSearchQuery.trim().toLowerCase()

  const filteredTracks = React.useMemo(
    () =>
      buildTrackPickerResults({
        allTracks,
        selectedTrackIds,
        draftSelectedTracks,
        normalizedQuery,
      }),
    [allTracks, draftSelectedTracks, normalizedQuery, selectedTrackIds]
  )

  const selectedTracksList = React.useMemo(
    () => buildSelectedTracksList(allTracks, selectedTrackIds),
    [allTracks, selectedTrackIds]
  )

  const updateName = React.useCallback((value: string) => {
    setName(clampPlaylistName(value))
  }, [])

  const updateDescription = React.useCallback((value: string) => {
    setDescription(clampPlaylistDescription(value))
  }, [])

  const toggleSelectedTrack = React.useCallback((trackId: string) => {
    setSelectedTrackIds((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId)
      }

      return [...prev, trackId]
    })
  }, [])

  const toggleDraftTrack = React.useCallback((trackId: string) => {
    setDraftSelectedTracks((prev) => toggleTrackSelection(prev, trackId))
  }, [])

  const openTrackSheet = React.useCallback(() => {
    setDraftSelectedTracks(new Set(selectedTrackIds))
    setIsTrackSheetOpen(true)
  }, [selectedTrackIds])

  const handleTrackSheetOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        setDraftSelectedTracks(new Set(selectedTrackIds))
        setIsTrackSheetOpen(true)
        return
      }

      setIsTrackSheetOpen(false)
      setSearchQuery("")
      setSearchInputKey((prev) => prev + 1)
      setDraftSelectedTracks(new Set(selectedTrackIds))
    },
    [selectedTrackIds]
  )

  const applyTrackSheetSelection = React.useCallback(() => {
    setSelectedTrackIds((prev) => {
      const previousSet = new Set(prev)
      const preservedOrder = prev.filter((id) => draftSelectedTracks.has(id))
      const appended = allTracks
        .map((track) => track.id)
        .filter((id) => draftSelectedTracks.has(id) && !previousSet.has(id))

      return [...preservedOrder, ...appended]
    })
    setIsTrackSheetOpen(false)
    setSearchQuery("")
    setSearchInputKey((prev) => prev + 1)
  }, [allTracks, draftSelectedTracks])

  const clearDraftTrackSelection = React.useCallback(() => {
    setDraftSelectedTracks(new Set())
  }, [])

  const reorderSelectedTracks = React.useCallback((from: number, to: number) => {
    setSelectedTrackIds((prev) => reorderTrackIds(prev, from, to))
  }, [])

  const save = React.useCallback(async () => {
    if (!name.trim() || savePlaylistMutation.isPending) {
      return
    }

    try {
      await savePlaylistMutation.mutateAsync({
        id: isEditMode ? playlistId : undefined,
        name,
        description: description.trim().length > 0 ? description : undefined,
        trackIds: selectedTrackIds,
      })
      onSaved()
    } catch (error) {
      logError("Playlist form save failed", error, {
        playlistId: playlistId ?? null,
        isEditMode,
      })
    }
  }, [
    description,
    isEditMode,
    name,
    onSaved,
    playlistId,
    savePlaylistMutation,
    selectedTrackIds,
  ])

  const isSaving = savePlaylistMutation.isPending
  const canSave = name.trim().length > 0 && !isSaving

  return {
    name,
    description,
    selectedTracksList,
    isTrackSheetOpen,
    searchInputKey,
    searchQuery,
    filteredTracks,
    draftSelectedTracks,
    isSaving,
    canSave,
    setSearchQuery,
    updateName,
    updateDescription,
    toggleSelectedTrack,
    reorderSelectedTracks,
    openTrackSheet,
    handleTrackSheetOpenChange,
    toggleDraftTrack,
    applyTrackSheetSelection,
    clearDraftTrackSelection,
    save,
  }
}