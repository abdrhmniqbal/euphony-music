/**
 * Purpose: Renders a compact animated loading indicator.
 * Caller: UI blocks that need inline loading overlays.
 * Dependencies: Reanimated shared values and app theme colors.
 * Main Functions: ScaleLoader()
 * Side Effects: Runs native-thread loading animations.
 */

import { View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

import { useThemeColors } from "@/modules/ui/theme"

const BAR_COUNT = 3
const BAR_WIDTH = 3
const BAR_DELAYS = Array.from({ length: BAR_COUNT }, (_, index) => index * 150)

interface ScaleLoaderProps {
  size?: number
}

function Bar({ delay, maxHeight }: { delay: number; maxHeight: number }) {
  const theme = useThemeColors()
  const scale = useDerivedValue(() =>
    withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 360 }), withTiming(0.35, { duration: 360 })),
        -1,
        false
      )
    )
  )

  const animatedStyle = useAnimatedStyle(() => ({
    height: scale.value * maxHeight,
  }))

  return (
    <Animated.View
      style={[
        {
          width: BAR_WIDTH,
          borderRadius: BAR_WIDTH / 2,
          backgroundColor: theme.accent,
        },
        animatedStyle,
      ]}
    />
  )
}

export function ScaleLoader({ size = 20 }: ScaleLoaderProps) {
  return (
    <View
      className="absolute inset-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 2,
          height: size,
        }}
      >
        {BAR_DELAYS.map((delay) => (
          <Bar key={delay} delay={delay} maxHeight={size} />
        ))}
      </View>
    </View>
  )
}
