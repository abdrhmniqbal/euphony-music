/* oxlint-disable react/immutability -- reanimated shared values are intentionally mutated via .value inside effects */
import { useThemeColor } from "heroui-native"
import { useEffect } from "react"
import { View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"

const BAR_COUNT = 3
const BAR_DURATION = 1000
const BAR_MIN = 0.3

interface ScaleLoaderProps {
  size?: number
}

function Bar({
  phase,
  maxHeight,
  width,
  color,
}: {
  phase: number
  maxHeight: number
  width: number
  color: string
}) {
  const progress = useSharedValue(phase)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(phase + 1, { duration: BAR_DURATION, easing: Easing.linear }),
      -1,
      false
    )
  }, [progress, phase])

  const animatedStyle = useAnimatedStyle(() => {
    const wave = 0.5 + 0.5 * Math.sin(progress.value * 2 * Math.PI)
    return {
      height: (BAR_MIN + (1 - BAR_MIN) * wave) * maxHeight,
    }
  })

  return (
    <Animated.View
      style={[
        {
          width,
          borderRadius: width / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  )
}

export function ScaleLoader({ size = 28 }: ScaleLoaderProps) {
  const accent = useThemeColor("accent")
  const barWidth = Math.max(3, Math.round(size * 0.24))
  const gap = Math.round(barWidth * 0.8)

  return (
    <View className="absolute inset-0 items-center justify-center rounded-lg bg-backdrop">
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap,
          height: size,
        }}
      >
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <Bar
            key={index}
            phase={index / BAR_COUNT}
            maxHeight={size}
            width={barWidth}
            color={accent}
          />
        ))}
      </View>
    </View>
  )
}
