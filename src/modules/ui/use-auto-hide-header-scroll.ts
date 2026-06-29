import { useMemo } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import { handleScroll, handleScrollStart, handleScrollStop } from "@/modules/ui/store"

export function useAutoHideHeaderScroll() {
  return useMemo(
    () => ({
      onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
        handleScroll(e.nativeEvent.contentOffset.y),
      onScrollBeginDrag: handleScrollStart,
      onMomentumScrollEnd: handleScrollStop,
      onScrollEndDrag: handleScrollStop,
      scrollEventThrottle: 16,
    }),
    []
  )
}
