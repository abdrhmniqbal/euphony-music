import { debounce } from "@tanstack/react-pacer/debouncer"
import { create } from "zustand"

interface UIState {
  barsVisible: boolean
}

export const useUIStore = create<UIState>()(() => ({
  barsVisible: true,
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
