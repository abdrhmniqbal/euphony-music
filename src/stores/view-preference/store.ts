import { useStore } from "zustand"

import { createPersistedStore } from "@/lib/zustand"
import type { ViewPreferenceStore } from "./constants"
import { omittedFields } from "./constants"

export const viewPreferenceStore = createPersistedStore<ViewPreferenceStore>((set) => ({
  _hasHydrated: false,
  _init: async () => set({ _hasHydrated: true }),
  albumLayout: "grid",
  albumIsAsc: true,
  albumOrder: "name",
  artistLayout: "list",
  artistIsAsc: true,
  artistOrder: "name",
  artistTracksIsAsc: true,
  artistTracksOrder: "name",
  folderIsAsc: true,
  folderOrder: "name",
  genreLayout: "list",
  genreIsAsc: true,
  genreOrder: "name",
  genreTracksIsAsc: true,
  genreTracksOrder: "name",
  playlistLayout: "grid",
  playlistIsAsc: true,
  playlistOrder: "name",
  trackIsAsc: true,
  trackOrder: "name",
}), {
  name: "startune::view-preferences",
  partialize: (state) =>
    Object.fromEntries(
      Object.entries(state).filter(([key]) => !omittedFields.includes(key))
    ),
  onRehydrateStorage: () => (state, error) => {
    if (error) console.warn("[View Preference Store]", error)
    else void state?._init(state)
  },
})

export function useViewPreferenceStore<T>(selector: (state: ViewPreferenceStore) => T): T {
  return useStore(viewPreferenceStore, selector)
}
