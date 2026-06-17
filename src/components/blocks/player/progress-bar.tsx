/**
 * Purpose: Renders and controls the player seek bar.
 * Caller: Full player content and compact player surfaces.
 * Dependencies: Player/cast playback controls, player progress selectors, Google Cast, and Reanimated gestures.
 * Main Functions: ProgressBar()
 * Side Effects: Seeks local or cast playback from user gestures.
 */

import * as React from "react"
import { Text, TextInput, type TextInputProps, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import {
  useCastState,
  useMediaStatus,
  useRemoteMediaClient,
  useStreamPosition,
} from "react-native-google-cast"
import Animated, {
  Layout,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { isCastConnected, seekCastPlayback } from "@/modules/cast/service"
import { seekTo } from "@/modules/player/controls"
import { usePlaybackProgressState } from "@/modules/player/selectors"

type AnimatedTimeInputProps = TextInputProps & { text?: string }

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput) as React.ComponentType<
  AnimatedTimeInputProps & {
    animatedProps?: Partial<AnimatedTimeInputProps>
  }
>

interface ProgressBarProps {
  compact?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ compact = false }) => {
  const { currentTime, duration } = usePlaybackProgressState()
  const castState = useCastState()
  const remoteMediaClient = useRemoteMediaClient()
  const mediaStatus = useMediaStatus()
  const castStreamPosition = useStreamPosition()
  const seekProgress = useSharedValue(0)
  const isSeeking = useSharedValue(false)
  const barWidth = useSharedValue(0)
  const pressed = useSharedValue(false)
  const isCasting = isCastConnected(castState, remoteMediaClient)
  const castDuration = Number(mediaStatus?.mediaInfo?.streamDuration ?? 0)
  const effectiveCurrentTime = Number(isCasting ? (castStreamPosition ?? 0) : (currentTime ?? 0))
  const effectiveDuration = Number(isCasting ? castDuration : (duration ?? 0))

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

  const seekPlayback = async (seekTime: number) => {
    if (isCasting) {
      await seekCastPlayback(remoteMediaClient, seekTime)
      return
    }

    await seekTo(seekTime)
  }

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
    await seekPlayback(seekTime)
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
