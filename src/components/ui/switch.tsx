import { useThemeColor } from "heroui-native"
import * as React from "react"
import { I18nManager, Pressable, StyleSheet } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"

const TRACK_WIDTH = 48
const TRACK_HEIGHT = 24
const THUMB_WIDTH = 28
const THUMB_HEIGHT = 20
const EDGE_OFFSET = 2
const TRAVEL = TRACK_WIDTH - THUMB_WIDTH - EDGE_OFFSET * 2

const TIMING_CONFIG = {
  duration: 175,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
}

const SPRING_CONFIG = { damping: 120, stiffness: 1600, mass: 2 }

interface SwitchProps {
  isSelected: boolean
  onSelectedChange?: (isSelected: boolean) => void
  isDisabled?: boolean
}

// heroui-native v1.0.8 animates the thumb via Yoga logical `start`/`end`,
// which reanimated drops on RN 0.86 new-arch (pill stays left while colors
// still transition). Local primitive using transform-based translation instead;
// visuals mirror heroui's switch.css tokens and timing configs.
export function Switch({ isSelected, onSelectedChange, isDisabled }: SwitchProps) {
  const [trackDefaultColor, accentColor, accentForegroundColor] = useThemeColor([
    "default",
    "accent",
    "accent-foreground",
  ])

  const isRTL = I18nManager.getConstants().isRTL
  const pressed = useSharedValue(false)

  const rTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: isSelected ? accentColor : trackDefaultColor,
    transform: [{ scale: withTiming(pressed.value ? 0.96 : 1, TIMING_CONFIG) }],
  }))

  const rThumbStyle = useAnimatedStyle(() => ({
    backgroundColor: isSelected ? accentForegroundColor : "white",
    transform: [
      {
        translateX: withSpring(
          (isSelected ? TRAVEL : 0) * (isRTL ? -1 : 1),
          SPRING_CONFIG,
        ),
      },
    ],
  }))

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}
      disabled={isDisabled}
      onPressIn={() => {
        pressed.value = true
      }}
      onPressOut={() => {
        pressed.value = false
      }}
      onPress={() => onSelectedChange?.(!isSelected)}
    >
      <Animated.View style={[styles.track, rTrackStyle, isDisabled && styles.disabled]}>
        <Animated.View style={[styles.thumb, rThumbStyle]} />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: {
    position: "absolute",
    start: EDGE_OFFSET,
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: THUMB_HEIGHT / 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  disabled: {
    opacity: 0.4,
  },
})
