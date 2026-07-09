/**
 * Purpose: Stores session-only UI chrome and player view preferences.
 * Caller: navigation layouts, tab/mini-player chrome, full player views, lyrics controls.
 * Dependencies: Zustand state container.
 * Main Functions: setBarsVisible(), setPlayerExpandedView(), setPlayerLyricsKaraokeEnabled(), setPlayerLyricsFontScale(), openPlayer(), closePlayer(), togglePlayerExpandedView()
 * Side Effects: Updates in-memory UI state for the current app session only.
 */

import AsyncStorage from "expo-sqlite/kv-store"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { debounce } from "@tanstack/react-pacer/debouncer"

export type PlayerExpandedView = "artwork" | "lyrics" | "queue"
export type PlayerLyricsFontScale = 1 | 1.2 | 1.4

interface UIState {
  barsVisible: boolean
  isPlayerExpanded: boolean
  playerExpandedView: PlayerExpandedView
  playerLyricsKaraokeEnabled: boolean
  playerLyricsFontScale: PlayerLyricsFontScale
}

export const useUIStore = create<UIState>()(
  persist(
    () => ({
      barsVisible: true,
      isPlayerExpanded: false,
      playerExpandedView: "artwork",
      playerLyricsKaraokeEnabled: false,
      playerLyricsFontScale: 1,
    }),
    {
      name: "startune::ui-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        playerLyricsKaraokeEnabled: state.playerLyricsKaraokeEnabled,
        playerLyricsFontScale: state.playerLyricsFontScale,
      }),
    }
  )
)

function getPlayerExpandedViewState() {
  return useUIStore.getState().playerExpandedView
}

function setBarsVisible(value: boolean) {
  useUIStore.setState({ barsVisible: value })
}

export function showBars() {
  setBarsVisible(true)
}

export function setPlayerExpandedView(value: PlayerExpandedView) {
  useUIStore.setState({ playerExpandedView: value })
}

export function setPlayerLyricsKaraokeEnabled(value: boolean) {
  useUIStore.setState({ playerLyricsKaraokeEnabled: value })
}

export function setPlayerLyricsFontScale(value: PlayerLyricsFontScale) {
  useUIStore.setState({ playerLyricsFontScale: value })
}

export function togglePlayerExpandedView(value: PlayerExpandedView) {
  const currentView = getPlayerExpandedViewState()
  useUIStore.setState({
    playerExpandedView: currentView === value ? "artwork" : value,
  })
}

const BARS_AUTO_SHOW_IDLE_MS = 200

const showBarsAfterIdle = debounce(() => {
  setBarsVisible(true)
}, { wait: BARS_AUTO_SHOW_IDLE_MS })

export function handleScroll() {
  setBarsVisible(false)
  showBarsAfterIdle()
}
