import * as React from "react"
import { useDebouncedValue } from "@tanstack/react-pacer"

import { useTracks } from "@/domains/tracks/queries"
import { toPlayerTracks } from "@/playback/player-track"
import { getPreferenceState } from "@/core/preferences/store"

import {
  buildSelectedTracksList,
  buildTrackPickerResults,
  clampPlaylistDescription,
  clampPlaylistName,
  toggleTrackSelection,
  reorderTrackIds,
} from "./utils"
import { useSavePlaylist } from "./queries"

const SEARCH_DEBOUNCE_MS = 140

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
  const savePlaylistMutation = useSavePlaylist(isEditMode)

  const isNameValid = name.trim().length > 0

  async function submit() {
    const trimmedName = name.trim()
    if (!trimmedName || savePlaylistMutation.isPending) {
      return
    }

    try {
      await savePlaylistMutation.mutateAsync({
        id: isEditMode ? playlistId : undefined,
        name: trimmedName,
        description: description.trim().length > 0 ? description.trim() : undefined,
        trackIds: selectedTrackIds,
      })
      onSaved()
    } catch {
      /* toast already shown by mutation */
    }
  }

  const { data: dbTracks = [] } = useTracks()
  const splitConfig = getPreferenceState().splitMultipleValueConfig
  const allTracks = React.useMemo(
    () => toPlayerTracks(dbTracks, splitConfig),
    [dbTracks, splitConfig]
  )

  const [isTrackSheetOpen, setIsTrackSheetOpen] = React.useState(false)
  const [searchInputKey, setSearchInputKey] = React.useState(0)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [draftSelectedTracks, setDraftSelectedTracks] = React.useState(
    () => new Set(selectedTrackIds)
  )

  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, { wait: SEARCH_DEBOUNCE_MS })
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

  const openTrackSheet = React.useCallback(() => {
    setDraftSelectedTracks(new Set(selectedTrackIds))
    setIsTrackSheetOpen(true)
  }, [selectedTrackIds])

  const handleTrackSheetClose = React.useCallback(() => {
    setIsTrackSheetOpen(false)
    setSearchQuery("")
    setSearchInputKey((prev) => prev + 1)
    setDraftSelectedTracks(new Set(selectedTrackIds))
  }, [selectedTrackIds])

  const toggleDraftTrack = React.useCallback((trackId: string) => {
    setDraftSelectedTracks((prev) => toggleTrackSelection(prev, trackId))
  }, [])

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
    name,
    setName,
    description,
    setDescription,
    isNameValid,
    submit,
    isSubmitting: savePlaylistMutation.isPending,
    selectedTracksList,
    toggleSelectedTrack,
    reorderSelectedTracks,
    isTrackSheetOpen,
    searchInputKey,
    searchQuery,
    setSearchQuery,
    filteredTracks,
    draftSelectedTracks,
    openTrackSheet,
    handleTrackSheetClose,
    toggleDraftTrack,
    applyTrackSheetSelection,
    clearDraftTrackSelection,
  }
}
