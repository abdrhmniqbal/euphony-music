/**
 * Purpose: Stores session-only UI chrome and player view preferences.
 * Caller: navigation layouts, tab/mini-player chrome, full player views, lyrics controls.
 * Dependencies: Zustand state container.
 * Main Functions: setBarsVisible(), setPlayerExpandedView(), setPlayerLyricsKaraokeEnabled(), setPlayerLyricsFontScale(), openPlayer(), closePlayer(), togglePlayerExpandedView()
 * Side Effects: Updates in-memory UI state for the current app session only.
 */

import { create } from "zustand"

export type PlayerExpandedView = "artwork" | "lyrics" | "queue"
export type PlayerLyricsFontScale = 1 | 1.2 | 1.4

interface UIState {
  barsVisible: boolean
  isPlayerExpanded: boolean
  playerExpandedView: PlayerExpandedView
  playerLyricsKaraokeEnabled: boolean
  playerLyricsFontScale: PlayerLyricsFontScale
}

export const useUIStore = create<UIState>(() => ({
  barsVisible: true,
  isPlayerExpanded: false,
  playerExpandedView: "artwork",
  playerLyricsKaraokeEnabled: false,
  playerLyricsFontScale: 1,
}))

function getPlayerExpandedViewState() {
  return useUIStore.getState().playerExpandedView
}

export function setBarsVisible(value: boolean) {
  useUIStore.setState({ barsVisible: value })
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

export function openPlayer(view: PlayerExpandedView = "artwork") {
  useUIStore.setState({
    isPlayerExpanded: true,
    playerExpandedView: view,
  })
}

export function closePlayer() {
  useUIStore.setState({
    isPlayerExpanded: false,
    playerExpandedView: "artwork",
  })
}

export function togglePlayerExpandedView(value: PlayerExpandedView) {
  const currentView = getPlayerExpandedViewState()
  useUIStore.setState({
    playerExpandedView: currentView === value ? "artwork" : value,
  })
}

let lastScrollY = 0
let showTimeout: ReturnType<typeof setTimeout> | null = null

export function handleScroll(currentY: number) {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }

  const isScrollingDown = currentY > lastScrollY && currentY > 50
  const isScrollingUp = currentY < lastScrollY

  if (isScrollingDown) {
    setBarsVisible(false)
  } else if (isScrollingUp) {
    setBarsVisible(true)
  }

  lastScrollY = currentY
}

export function handleScrollStart() {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }
}

export function handleScrollStop() {
  if (showTimeout) {
    clearTimeout(showTimeout)
  }
  showTimeout = setTimeout(() => {
    setBarsVisible(true)
  }, 150)
}
