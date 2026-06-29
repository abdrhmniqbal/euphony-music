import { useDebouncedValue } from "@tanstack/react-pacer"
import * as React from "react"

import type { Track } from "@/modules/player/types"
import { buildTrackPickerResults } from "@/modules/playlist/form"
import { toggleTrackSelection } from "@/modules/playlist/utils"

const SEARCH_DEBOUNCE_MS = 140

interface UseTrackPickerDraftOptions {
  allTracks: Track[]
  selectedTrackIds: string[]
  setSelectedTrackIds: React.Dispatch<React.SetStateAction<string[]>>
}

export function useTrackPickerDraft({
  allTracks,
  selectedTrackIds,
  setSelectedTrackIds,
}: UseTrackPickerDraftOptions) {
  const [isTrackSheetOpen, setIsTrackSheetOpen] = React.useState(false)
  const [searchInputKey, setSearchInputKey] = React.useState(0)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [draftSelectedTracks, setDraftSelectedTracks] = React.useState(
    () => new Set(selectedTrackIds)
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
  }, [allTracks, draftSelectedTracks, setSelectedTrackIds])

  const clearDraftTrackSelection = React.useCallback(() => {
    setDraftSelectedTracks(new Set())
  }, [])

  return {
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
