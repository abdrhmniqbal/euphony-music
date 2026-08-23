import { create } from "zustand"

interface PlaylistFormDraftState {
  source: "queue" | null
  trackIds: string[]
}

const usePlaylistFormDraftStore = create<PlaylistFormDraftState>(() => ({
  source: null,
  trackIds: [],
}))

export function setPlaylistFormDraft(trackIds: string[], source: "queue" | null = null) {
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
