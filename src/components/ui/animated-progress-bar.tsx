import * as React from "react"
import { useEffect } from "react"
import { LinearGradient } from "expo-linear-gradient"
import { Dimensions, Text, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

import { useThemeColors } from "@/hooks/use-theme-colors"

import type { AnimatedProgressBarProps } from "./animated-progress-bar.types"

const styles = {
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    justifyContent: "center",
    position: "relative",
  },
  percentageText: {
    fontSize: 12,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  insideTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    flex: 1,
  },
} as const

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress = 0,
  animationDuration = 800,
  width = "100%",
  height = 10,
  progressColor,
  trackColor,
  borderRadius = 4,
  showPercentage = false,
  percentagePosition = "right",
  percentageTextStyle,
  containerStyle,
  formatPercentage = (value: number) => `${Math.round(value * 100)}%`,
  indeterminate = false,
  pulsate = false,
  onAnimationComplete,
  gradientColors,
  useGradient = false,
}) => {
  const theme = useThemeColors()
  const resolvedProgressColor = progressColor ?? theme.accent
  const resolvedTrackColor = trackColor ?? theme.default
  const resolvedGradientColors = gradientColors ?? [theme.accent, theme.link]

  const validProgress = Math.min(Math.max(progress, 0), 1)

  const progressValue = useSharedValue(0)
  const indeterminateValue = useSharedValue(0)
  const pulseValue = useSharedValue(1)

  const screenWidth = Dimensions.get("window").width

  const containerWidth =
    typeof width === "string"
      ? width.endsWith("%")
        ? screenWidth * (Number.parseFloat(width) / 100)
        : Number.parseFloat(width) || screenWidth
      : width

  useEffect(() => {
    if (!indeterminate) {
      progressValue.value = withTiming(
        validProgress,
        {
          duration: animationDuration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
        (isFinished) => {
          if (isFinished && onAnimationComplete) {
            onAnimationComplete()
          }
        }
      )
    }
  }, [
    validProgress,
    animationDuration,
    onAnimationComplete,
    indeterminate,
    progressValue,
  ])

  useEffect(() => {
    if (indeterminate) {
      indeterminateValue.value = 0
      indeterminateValue.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      )
    } else {
      indeterminateValue.value = 0
    }

    return () => {
      indeterminateValue.value = 0
    }
  }, [indeterminate, indeterminateValue])

  useEffect(() => {
    if (pulsate && !indeterminate && validProgress > 0) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.ease }),
          withTiming(1, { duration: 500, easing: Easing.ease })
        ),
        -1,
        true
      )
    } else {
      pulseValue.value = 1
    }

    return () => {
      pulseValue.value = 1
    }
  }, [pulsate, indeterminate, validProgress, pulseValue])

  const progressBarStyle = useAnimatedStyle(() => {
    if (indeterminate) {
      return {
        position: "absolute",
        left: 0,
        top: 0,
        width: "30%",
        height: "100%",
        backgroundColor: useGradient ? "transparent" : resolvedProgressColor,
        borderRadius,
        transform: [
          { translateX: indeterminateValue.value * containerWidth * 0.7 },
        ],
      }
    }

    return {
      width: `${progressValue.value * 100}%`,
      backgroundColor: useGradient ? "transparent" : resolvedProgressColor,
      borderRadius,
      height: "100%",
      transform: pulsate ? [{ scale: pulseValue.value }] : [],
    }
  })

  const renderPercentageText = () => {
    if (!showPercentage) return null

    const textContent = formatPercentage(validProgress)
    const textElement = (
      <Text
        style={[
          styles.percentageText,
          { color: theme.foreground },
          percentageTextStyle,
        ]}
      >
        {textContent}
      </Text>
    )

    if (percentagePosition === "inside" && validProgress > 0.1) {
      return <View style={styles.insideTextContainer}>{textElement}</View>
    }

    return textElement
  }

  const renderProgressBar = () => {
    if (useGradient) {
      return (
        <Animated.View style={progressBarStyle}>
          <LinearGradient
            colors={resolvedGradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, { borderRadius }]}
          >
            {percentagePosition === "inside" && renderPercentageText()}
          </LinearGradient>
        </Animated.View>
      )
    }

    return (
      <Animated.View style={progressBarStyle}>
        {percentagePosition === "inside" && renderPercentageText()}
      </Animated.View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection:
            percentagePosition === "left" || percentagePosition === "right"
              ? "row"
              : "column",
        },
        containerStyle,
      ]}
    >
      {percentagePosition === "left" && renderPercentageText()}
      {percentagePosition === "top" && renderPercentageText()}

      <View
        style={[
          styles.track,
          {
            width,
            height,
            backgroundColor: resolvedTrackColor,
            borderRadius,
            overflow: "hidden",
          },
        ]}
      >
        {renderProgressBar()}
      </View>

      {percentagePosition === "right" && renderPercentageText()}
      {percentagePosition === "bottom" && renderPercentageText()}
    </View>
  )
}
