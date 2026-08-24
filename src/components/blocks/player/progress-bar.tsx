/* oxlint-disable react/immutability, react/refs -- reanimated shared values are intentionally mutated via .value from gesture worklets and JS callbacks */
import * as React from "react"
import { Text, TextInput, type TextInputProps, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  Layout,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { usePlaybackProgressState } from "@/playback/selectors"
import { useCastAwarePlayback } from "@/playback/cast-aware-playback"

type AnimatedTimeInputProps = TextInputProps & { text?: string }

// SAFETY: createAnimatedComponent extends the base props with animatedProps, which its returned type omits
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput) as React.ComponentType<
  AnimatedTimeInputProps & {
    animatedProps?: Partial<AnimatedTimeInputProps>
  }
>

interface ProgressBarProps {
  compact?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ compact = false }) => {
  const cast = useCastAwarePlayback(false)
  const seekTo = cast.seek
  const { currentTime, duration } = usePlaybackProgressState()
  const seekProgress = useSharedValue(0)
  const isSeeking = useSharedValue(false)
  const barWidth = useSharedValue(0)
  const pressed = useSharedValue(false)

  const effectiveCurrentTime = Number(currentTime ?? 0)
  const effectiveDuration = Number(duration ?? 0)

  const liveProgress = useDerivedValue(() => {
    if (effectiveDuration <= 0) {
      return 0
    }

    return withTiming(effectiveCurrentTime / effectiveDuration, {
      duration: 120,
    })
  })
  const durationSv = useDerivedValue(() => effectiveDuration)
  const displayProgress = useDerivedValue(() =>
    isSeeking.value ? seekProgress.value : liveProgress.value
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const animatedTextProps = useAnimatedProps<Partial<AnimatedTimeInputProps>>(() => {
    const seconds = displayProgress.value * durationSv.value
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const text = `${mins}:${secs < 10 ? "0" : ""}${secs}`
    return {
      text,
    }
  })

  const seekNonce = React.useRef(0)

  const finishSeek = async (seekTime: number, nonce: number) => {
    await seekTo(seekTime)
    if (seekNonce.current === nonce) {
      isSeeking.value = false
      pressed.value = false
    }
  }

  const seekGesture = Gesture.Pan()
    .onStart((e) => {
      isSeeking.value = true
      pressed.value = true
      seekNonce.current += 1
      if (barWidth.value > 0) {
        seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth.value))
      }
    })
    .onUpdate((e) => {
      if (barWidth.value > 0) {
        seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth.value))
      }
    })
    .onEnd(() => {
      const seekTime = displayProgress.value * effectiveDuration
      const currentNonce = seekNonce.current
      runOnJS(finishSeek)(seekTime, currentNonce)
    })

  const tapGesture = Gesture.Tap()
    .onStart((e) => {
      isSeeking.value = true
      pressed.value = true
      seekNonce.current += 1
      if (barWidth.value > 0) {
        seekProgress.value = Math.max(0, Math.min(1, e.x / barWidth.value))
      }
    })
    .onEnd(() => {
      const seekTime = displayProgress.value * effectiveDuration
      const currentNonce = seekNonce.current
      runOnJS(finishSeek)(seekTime, currentNonce)
    })

  const progressStyle = useAnimatedStyle(() => ({
    width: `${displayProgress.value * 100}%`,
  }))

  const barContainerStyle = useAnimatedStyle(() => ({
    height: withTiming(pressed.value ? 12 : 4, { duration: 200 }),
  }))

  return (
    <Animated.View layout={Layout.duration(300)} className={compact ? "mb-4" : "mb-6"}>
      <GestureDetector gesture={Gesture.Exclusive(seekGesture, tapGesture)}>
        <View
          className={compact ? "py-2" : "py-4"}
          onLayout={(e) => {
            barWidth.value = e.nativeEvent.layout.width
          }}
        >
          <Animated.View
            style={barContainerStyle}
            className="w-full overflow-hidden rounded-full bg-white/20"
          >
            <Animated.View
              style={[progressStyle, { backgroundColor: "#FFFFFF" }]}
              className="h-full rounded-full"
            />
          </Animated.View>
        </View>
      </GestureDetector>
      <View className="mt-2 flex-row justify-between">
        <AnimatedTextInput
          animatedProps={animatedTextProps}
          className="font-variant-numeric-tabular-nums p-0 text-xs text-white/50"
          editable={false}
          value={formatTime(effectiveCurrentTime)}
          style={{ color: "rgba(255, 255, 255, 0.5)" }}
        />
        <Text className="text-xs text-white/50">{formatTime(effectiveDuration)}</Text>
      </View>
    </Animated.View>
  )
}
