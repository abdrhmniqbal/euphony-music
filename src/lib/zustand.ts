import AsyncStorage from "expo-sqlite/kv-store"
import type { StateCreator } from "zustand"
import type { PersistOptions } from "zustand/middleware"
import { createJSONStorage, persist } from "zustand/middleware"
import { createStore } from "zustand/vanilla"

export function createPersistedStore<TStore extends object>(
  initialState: StateCreator<TStore>,
  options: Omit<PersistOptions<TStore, Partial<TStore>>, "storage">
) {
  return createStore<TStore>()(
    persist<TStore, [], [], Partial<TStore>>(initialState, {
      storage: createJSONStorage(() => AsyncStorage),
      ...options,
    })
  )
}
