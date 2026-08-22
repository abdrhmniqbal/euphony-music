import * as React from "react"
import { View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated"
import type { SharedValue } from "react-native-reanimated"

interface PlayerDragHandleProps {
  dragY: SharedValue<number>
  onClose: () => void
}

export const PlayerDragHandle: React.FC<PlayerDragHandleProps> = ({ dragY, onClose }) => {
  const handleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragY.value, [0, 90], [1, 0.72]),
  }))

  const handleGesture = Gesture.Race(
    Gesture.Tap().onEnd(() => {
      runOnJS(onClose)()
    }),
    Gesture.Pan()
      .activeOffsetY(4)
      .onUpdate((event) => {
        dragY.value = event.translationY > 0 ? event.translationY : 0
      })
      .onEnd(() => {
        const shouldClose = dragY.value > 72
        dragY.value = withSpring(0, { damping: 18, stiffness: 230 })

        if (shouldClose) {
          runOnJS(onClose)()
        }
      })
  )

  return (
    <GestureDetector gesture={handleGesture}>
      <Animated.View className="absolute -top-4 z-10 self-center px-6 py-4" style={handleStyle}>
        <View className="h-1.5 w-12 rounded-full bg-white/40" />
      </Animated.View>
    </GestureDetector>
  )
}
