import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

interface DraftSelectionState {
  ids: ReadonlySet<string>
}

const EMPTY_SET: ReadonlySet<string> = new Set()

// External store so picker rows observe selection directly; list-cell prop propagation is unreliable
export const draftSelectionStore = createStore<DraftSelectionState>(() => ({
  ids: EMPTY_SET,
}))

export function setDraftSelection(ids: ReadonlySet<string>): void {
  draftSelectionStore.setState({ ids })
}

export function toggleDraftSelectionId(trackId: string): void {
  const current = draftSelectionStore.getState().ids
  const next = new Set(current)

  if (next.has(trackId)) {
    next.delete(trackId)
  } else {
    next.add(trackId)
  }

  draftSelectionStore.setState({ ids: next })
}

export function useDraftSelectedTracks(): ReadonlySet<string> {
  return useStore(draftSelectionStore, (state) => state.ids)
}

export function useIsDraftSelected(trackId: string): boolean {
  return useStore(draftSelectionStore, (state) => state.ids.has(trackId))
}
