import { debounce } from "@tanstack/react-pacer/debouncer"
import { create } from "zustand"

export type PlayerExpandedView = "artwork" | "lyrics" | "queue"

export type PlayerLyricsFontScale = 1 | 1.2 | 1.4

interface UIState {
  barsVisible: boolean
  playerExpandedView: PlayerExpandedView
  playerLyricsKaraokeEnabled: boolean
  playerLyricsFontScale: PlayerLyricsFontScale
}

export const useUIStore = create<UIState>()(() => ({
  barsVisible: true,
  playerExpandedView: "artwork",
  playerLyricsKaraokeEnabled: false,
  playerLyricsFontScale: 1,
}))

function setBarsVisible(value: boolean) {
  useUIStore.setState({ barsVisible: value })
}

export function showBars() {
  setBarsVisible(true)
}

const BARS_AUTO_SHOW_IDLE_MS = 200

const showBarsAfterIdle = debounce(
  () => {
    setBarsVisible(true)
  },
  { wait: BARS_AUTO_SHOW_IDLE_MS }
)

export function handleScroll() {
  setBarsVisible(false)
  showBarsAfterIdle()
}

export function setPlayerExpandedView(value: PlayerExpandedView) {
  useUIStore.setState({ playerExpandedView: value })
}

export function togglePlayerExpandedView(value: PlayerExpandedView) {
  const currentView = useUIStore.getState().playerExpandedView
  useUIStore.setState({
    playerExpandedView: currentView === value ? "artwork" : value,
  })
}

export function setPlayerLyricsKaraokeEnabled(value: boolean) {
  useUIStore.setState({ playerLyricsKaraokeEnabled: value })
}

export function setPlayerLyricsFontScale(value: PlayerLyricsFontScale) {
  useUIStore.setState({ playerLyricsFontScale: value })
}
