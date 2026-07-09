import { useMemo } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import { handleScroll, showBars } from "@/modules/ui/store"

const NON_SCROLLABLE_THRESHOLD = 4

export function useAutoHideHeaderScroll() {
  return useMemo(
    () => ({
      onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentSize, layoutMeasurement } = e.nativeEvent
        const hasContentMetrics =
          typeof contentSize?.height === "number" &&
          typeof layoutMeasurement?.height === "number"
        if (
          hasContentMetrics &&
          contentSize.height - layoutMeasurement.height <= NON_SCROLLABLE_THRESHOLD
        ) {
          showBars()
          return
        }
        handleScroll()
      },
      scrollEventThrottle: 16,
    }),
    []
  )
}
