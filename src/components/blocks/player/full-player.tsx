import * as React from "react"
import { useEffect } from "react"
import { useStore } from "@nanostores/react"
import { LinearGradient } from "expo-linear-gradient"
import { Dimensions, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { $isPlayerExpanded, $showPlayerQueue } from "@/hooks/scroll-bars.store"
import {
  $currentColors,
  updateColorsForImage,
} from "@/modules/player/player-colors.store"
import {
  $currentTime,
  $currentTrack,
  $duration,
  $isPlaying,
} from "@/modules/player/player.store"

import { AlbumArtView } from "./album-art-view"
import { PlaybackControls } from "./playback-controls"
import { PlayerFooter } from "./player-footer"
import { PlayerHeader } from "./player-header"
import { ProgressBar } from "./progress-bar"
import { QueueView } from "./queue-view"
import { TrackInfo } from "./track-info"

const SCREEN_HEIGHT = Dimensions.get("window").height

export function FullPlayer() {
  const isExpanded = useStore($isPlayerExpanded)
  const currentTrack = useStore($currentTrack)
  const isPlaying = useStore($isPlaying)
  const currentTimeVal = useStore($currentTime)
  const durationVal = useStore($duration)
  const showQueue = useStore($showPlayerQueue)
  const colors = useStore($currentColors)

  const translateY = useSharedValue(SCREEN_HEIGHT)
  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)

  useEffect(() => {
    updateColorsForImage(currentTrack?.image)
  }, [currentTrack?.image])

  useEffect(() => {
    if (isExpanded) {
      translateY.value = withTiming(0, { duration: 300 })
      scale.value = withTiming(1, { duration: 350 })
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 })
      scale.value = withTiming(0.9, { duration: 200 })
      opacity.value = withTiming(0, { duration: 150 })
    }
  }, [isExpanded, opacity, scale, translateY])

  const closePlayer = () => {
    $isPlayerExpanded.set(false)
    $showPlayerQueue.set(false)
  }

  const panGesture = Gesture.Pan()
    .activeOffsetY(20)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closePlayer)()
      } else {
        translateY.value = withTiming(0, { duration: 200 })
      }
    })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
    }
  })

  if (!currentTrack) return null

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "black",
            zIndex: 1000,
          },
        ]}
      >
        <View className="relative flex-1">
          <LinearGradient
            colors={[colors.bg, colors.secondary, "#000000"]}
            locations={[0, 0.6, 1]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />

          <View className="flex-1 justify-between px-6 pt-12 pb-12">
            <PlayerHeader onClose={closePlayer} />

            {showQueue ? (
              <QueueView currentTrack={currentTrack} />
            ) : (
              <AlbumArtView currentTrack={currentTrack} />
            )}

            <TrackInfo track={currentTrack} compact={showQueue} />

            <ProgressBar
              currentTime={currentTimeVal}
              duration={durationVal}
              compact={showQueue}
            />

            <PlaybackControls isPlaying={isPlaying} compact={showQueue} />

            <PlayerFooter />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}
