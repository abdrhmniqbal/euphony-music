import { debounce } from "@tanstack/react-pacer/debouncer"
import { create } from "zustand"

export type PlayerExpandedView = "artwork" | "lyrics" | "queue"

interface UIState {
  barsVisible: boolean
  playerExpandedView: PlayerExpandedView
}

export const useUIStore = create<UIState>()(() => ({
  barsVisible: true,
  playerExpandedView: "artwork",
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
