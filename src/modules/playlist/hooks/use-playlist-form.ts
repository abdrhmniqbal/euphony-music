import { useEffect, useMemo, useState } from "react"
import { useDebouncedValue } from "@tanstack/react-pacer"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getAllTracks } from "@/modules/player/player.api"
import type { Track } from "@/modules/player/player.types"
import { createPlaylist, updatePlaylist } from "@/modules/playlist/playlist.api"
import { usePlaylist } from "@/modules/playlist/playlist.queries"
import {
  clampPlaylistDescription,
  clampPlaylistName,
  toggleTrackSelection,
} from "@/modules/playlist/playlist.utils"

const SEARCH_DEBOUNCE_MS = 140
const LIBRARY_TRACKS_QUERY_KEY = ["library", "tracks"] as const
const PLAYLISTS_QUERY_KEY = ["playlists"] as const

interface PlaylistFormPayload {
  id?: string
  name: string
  description?: string
  trackIds: string[]
}

export function usePlaylistFormScreen(
  onSaved: () => void,
  playlistId?: string
) {
  const normalizedPlaylistId = playlistId?.trim() ?? ""
  const isEditMode = normalizedPlaylistId.length > 0
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(
    () => new Set()
  )
  const [isTrackSheetOpen, setIsTrackSheetOpen] = useState(false)
  const [searchInputKey, setSearchInputKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [hasInitializedEditState, setHasInitializedEditState] = useState(false)

  const { data: playlistToEdit, isLoading: isEditPlaylistLoading } =
    usePlaylist(normalizedPlaylistId, isEditMode)

  const savePlaylistMutation = useMutation({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYLISTS_QUERY_KEY })
      if (isEditMode) {
        queryClient.invalidateQueries({
          queryKey: [PLAYLISTS_QUERY_KEY[0], normalizedPlaylistId],
        })
      }
    },
  })

  const { data: allTracks = [] } = useQuery<Track[]>({
    queryKey: LIBRARY_TRACKS_QUERY_KEY,
    queryFn: getAllTracks,
    enabled: isTrackSheetOpen || isEditMode || selectedTracks.size > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, {
    wait: SEARCH_DEBOUNCE_MS,
  })

  useEffect(() => {
    let isCancelled = false

    queueMicrotask(() => {
      if (isCancelled) {
        return
      }

      setName("")
      setDescription("")
      setSelectedTracks(new Set())

      if (!isEditMode) {
        setHasInitializedEditState(true)
        return
      }

      setHasInitializedEditState(false)
    })

    return () => {
      isCancelled = true
    }
  }, [isEditMode, normalizedPlaylistId])

  useEffect(() => {
    if (!isEditMode || hasInitializedEditState || isEditPlaylistLoading) {
      return
    }

    let isCancelled = false

    queueMicrotask(() => {
      if (isCancelled) {
        return
      }

      if (!playlistToEdit) {
        setHasInitializedEditState(true)
        return
      }

      setName(clampPlaylistName(playlistToEdit.name))
      setDescription(clampPlaylistDescription(playlistToEdit.description || ""))
      setSelectedTracks(
        new Set(
          (playlistToEdit.tracks || []).map(
            (playlistTrack) => playlistTrack.trackId
          )
        )
      )
      setHasInitializedEditState(true)
    })

    return () => {
      isCancelled = true
    }
  }, [
    isEditMode,
    hasInitializedEditState,
    isEditPlaylistLoading,
    playlistToEdit,
  ])

  function updateName(value: string) {
    setName(clampPlaylistName(value))
  }

  function updateDescription(value: string) {
    setDescription(clampPlaylistDescription(value))
  }

  function toggleTrack(trackId: string) {
    setSelectedTracks((prev) => toggleTrackSelection(prev, trackId))
  }

  function openTrackSheet() {
    setIsTrackSheetOpen(true)
  }

  function handleTrackSheetOpenChange(open: boolean) {
    setIsTrackSheetOpen(open)
    if (!open) {
      setSearchQuery("")
      setSearchInputKey((prev) => prev + 1)
    }
  }

  async function save() {
    if (
      !name.trim() ||
      savePlaylistMutation.isPending ||
      (isEditMode && !playlistToEdit)
    ) {
      return
    }

    try {
      await savePlaylistMutation.mutateAsync({
        id: isEditMode ? normalizedPlaylistId : undefined,
        name,
        description: description.trim().length > 0 ? description : undefined,
        trackIds: Array.from(selectedTracks),
      })
      onSaved()
    } catch {
      // Keep screen state intact when save fails.
    }
  }

  const normalizedQuery = debouncedSearchQuery.trim().toLowerCase()
  const filteredTracks = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return allTracks
    }

    return allTracks.filter((track) => {
      const title = track.title.toLowerCase()
      const artist = (track.artist || "").toLowerCase()
      const album = (track.album || "").toLowerCase()
      return (
        title.includes(normalizedQuery) ||
        artist.includes(normalizedQuery) ||
        album.includes(normalizedQuery)
      )
    })
  }, [allTracks, normalizedQuery])

  const selectedTracksList = useMemo(
    () => allTracks.filter((track) => selectedTracks.has(track.id)),
    [allTracks, selectedTracks]
  )

  return {
    name,
    description,
    selectedTracks,
    isTrackSheetOpen,
    searchInputKey,
    searchQuery,
    filteredTracks,
    isEditMode,
    isSaving: savePlaylistMutation.isPending,
    canSave:
      name.trim().length > 0 &&
      !savePlaylistMutation.isPending &&
      (!isEditMode || Boolean(playlistToEdit)),
    selectedTracksList,
    setName: updateName,
    setDescription: updateDescription,
    setSearchQuery,
    toggleTrack,
    openTrackSheet,
    handleTrackSheetOpenChange,
    save,
  }
}
