import { useStore } from "zustand"

import { createPersistedStore } from "@/lib/zustand"

import { getDefaultPreferenceState } from "./defaults"
import { hydrateWithDefaults } from "./hydrate"
import { applyStartupPreferences } from "./startup"
import type { PreferenceState } from "./types"

export const preferenceStore = createPersistedStore<PreferenceState>(
  () => getDefaultPreferenceState(),
  {
    name: "startune::preferences",
    merge: (persisted, current) => ({
      ...hydrateWithDefaults(current, persisted),
      _hasHydrated: false,
    }),
    onRehydrateStorage: () => (state, error) => {
      if (error || !state) {
        console.warn("[Preferences]", error)
        preferenceStore.setState({ _hasHydrated: true })
        return
      }

      void applyStartupPreferences(state)
        .catch((rehydrateError) => {
          console.warn("[Preferences] startup side effects failed", rehydrateError)
        })
        .finally(() => {
          preferenceStore.setState({ _hasHydrated: true })
        })
    },
  }
)

export function usePreferenceStore<T>(selector: (state: PreferenceState) => T): T {
  return useStore(preferenceStore, selector)
}

export function getPreferenceState() {
  return preferenceStore.getState()
}
