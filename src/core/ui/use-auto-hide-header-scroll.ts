import { useMemo } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"

import { isNumber } from "@/lib/guards"

import { handleScroll, showBars } from "./store"

const NON_SCROLLABLE_THRESHOLD = 4

export function useAutoHideHeaderScroll() {
  return useMemo(
    () => ({
      onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentSize, layoutMeasurement } = e.nativeEvent
        const hasContentMetrics =
          isNumber(contentSize?.height) && isNumber(layoutMeasurement?.height)
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
