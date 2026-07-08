import { useMemo } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import { handleScroll, handleScrollStart, handleScrollStop, showBars } from "@/modules/ui/store"

const NON_SCROLLABLE_THRESHOLD = 4

export function useAutoHideHeaderScroll() {
  return useMemo(
    () => ({
      onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
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
        handleScroll(contentOffset.y)
      },
      onScrollBeginDrag: handleScrollStart,
      onMomentumScrollEnd: handleScrollStop,
      onScrollEndDrag: handleScrollStop,
      scrollEventThrottle: 16,
    }),
    []
  )
}
