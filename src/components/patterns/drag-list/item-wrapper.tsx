import React, { type ReactNode } from "react"
import Animated, {
  clamp,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated"

import { INACTIVE, useDragListStore } from "./store"

const SHIFT_DURATION = 150

interface ItemWrapperProps {
  index: number
  children: ReactNode
}

export function ItemWrapper({ index, children }: ItemWrapperProps) {
  const { pan, activeIndex, shifted, itemSize, dataLength } = useDragListStore()

  const translateY = useDerivedValue(() => {
    const active = activeIndex.get()
    if (active === INACTIVE) return withTiming(0, { duration: SHIFT_DURATION })
    if (index === active) return pan.get()

    const target = clamp(active + shifted.get(), 0, dataLength - 1)
    if (target > active && index > active && index <= target) {
      return withTiming(-itemSize, { duration: SHIFT_DURATION })
    }
    if (target < active && index >= target && index < active) {
      return withTiming(itemSize, { duration: SHIFT_DURATION })
    }
    return withTiming(0, { duration: SHIFT_DURATION })
  })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
    zIndex: activeIndex.get() === index ? 10 : 0,
  }))

  return <Animated.View style={animatedStyle}>{children}</Animated.View>
}
