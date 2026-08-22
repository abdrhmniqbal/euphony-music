import { useStore } from "zustand"

import { createPersistedStore } from "@/lib/zustand"

import { hydrateWithDefaults } from "./hydrate"
import type { ViewPreferenceState } from "./view-types"

const DEFAULT_VIEW_PREFERENCE_STATE: ViewPreferenceState = {
  _hasHydrated: false,
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
}

export const viewPreferenceStore = createPersistedStore<ViewPreferenceState>(
  () => DEFAULT_VIEW_PREFERENCE_STATE,
  {
    name: "startune::view-preferences",
    merge: (persisted, current) => ({
      ...hydrateWithDefaults(current, persisted),
      _hasHydrated: false,
    }),
    onRehydrateStorage: () => (state, error) => {
      if (error || !state) {
        console.warn("[View Preferences]", error)
      }
      viewPreferenceStore.setState({ _hasHydrated: true })
    },
  }
)

export function useViewPreferenceStore<T>(selector: (state: ViewPreferenceState) => T): T {
  return useStore(viewPreferenceStore, selector)
}
