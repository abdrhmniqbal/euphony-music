/**
 * Purpose: Stores temporary playlist form draft data that is too large for navigation params.
 * Caller: player action sheet and playlist form screen.
 * Dependencies: Zustand.
 * Main Functions: setPlaylistFormDraft(), consumePlaylistFormDraft(), clearPlaylistFormDraft()
 * Side Effects: Updates in-memory Zustand draft state.
 */

import { create } from "zustand"

interface PlaylistFormDraftState {
  source: "queue" | null
  trackIds: string[]
}

const usePlaylistFormDraftStore = create<PlaylistFormDraftState>(() => ({
  source: null,
  trackIds: [],
}))

export function setPlaylistFormDraft(
  trackIds: string[],
  source: "queue" | null = null
) {
  usePlaylistFormDraftStore.setState({ source, trackIds })
}

export function consumePlaylistFormDraft() {
  const draft = usePlaylistFormDraftStore.getState()
  clearPlaylistFormDraft()
  return draft
}

export function clearPlaylistFormDraft() {
  usePlaylistFormDraftStore.setState({ source: null, trackIds: [] })
}
