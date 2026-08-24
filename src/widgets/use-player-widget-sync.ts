import { useEffect } from "react"
import { Platform } from "react-native"

import { playbackStore } from "@/playback/playback-store"
import { refreshPlayerWidget } from "@/widgets/widget-task-handler"

const SYNC_DEBOUNCE_MS = 250

export function usePlayerWidgetSync(): void {
  useEffect(() => {
    if (Platform.OS !== "android") return

    let timer: ReturnType<typeof setTimeout> | null = null
    let previousKey = `${playbackStore.getState().activeKey}:${playbackStore.getState().isPlaying}`

    const unsubscribe = playbackStore.subscribe((state) => {
      const nextKey = `${state.activeKey}:${state.isPlaying}`
      if (nextKey === previousKey) return
      previousKey = nextKey

      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void refreshPlayerWidget()
      }, SYNC_DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [])
}
