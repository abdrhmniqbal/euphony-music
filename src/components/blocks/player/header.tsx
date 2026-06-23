/**
 * Purpose: Renders expanded player top controls, drag handle, and queue source context label.
 * Caller: FullPlayerContent.
 * Dependencies: gesture handler, Reanimated, Google Cast button, localization, and player queue context type.
 * Main Functions: PlayerHeader()
 * Side Effects: Runs close gesture callbacks and opens player action controls when available.
 */

import type { PlayerQueueContext } from "@/modules/player/types"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { CastButton } from "react-native-google-cast"
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated"
import type { SharedValue } from "react-native-reanimated"

import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"

const PLAYER_QUEUE_CONTEXT_LABEL_KEYS: Record<PlayerQueueContext["type"], string> = {
  album: "player.playingFrom.album",
  artist: "player.playingFrom.artist",
  playlist: "player.playingFrom.playlist",
  genre: "player.playingFrom.genre",
  search: "player.playingFrom.search",
  favorites: "player.playingFrom.favorites",
  folder: "player.playingFrom.folder",
  mix: "player.playingFrom.default",
  trackList: "player.playingFrom.trackList",
  external: "player.playingFrom.external",
}

const PLAYER_QUEUE_CONTEXT_TITLE_KEYS: Partial<Record<PlayerQueueContext["type"], string>> = {
  favorites: "library.favorites",
  folder: "library.folders",
  genre: "library.genre",
  playlist: "library.playlists",
  search: "navigation.tabs.search",
  trackList: "library.tracks",
}

function normalizeQueueContextText(value: string) {
  return value.trim().toLowerCase()
}

interface PlayerHeaderProps {
  onClose: () => void
  onOpenMore?: () => void
  dragY: SharedValue<number>
  queueContext: PlayerQueueContext | null
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  onClose,
  onOpenMore,
  dragY,
  queueContext,
}) => {
  const { t } = useTranslation()
  const queueContextLabel = queueContext
    ? t(PLAYER_QUEUE_CONTEXT_LABEL_KEYS[queueContext.type])
    : ""
  const labelSuffix = queueContextLabel.replace(t("player.playingFrom.default"), "")
  const repeatedTitleKey = queueContext
    ? PLAYER_QUEUE_CONTEXT_TITLE_KEYS[queueContext.type]
    : undefined
  const repeatedLocalizedTitle = repeatedTitleKey ? t(repeatedTitleKey) : ""
  const shouldUseDefaultLabel = Boolean(
    queueContext &&
    (normalizeQueueContextText(labelSuffix) === normalizeQueueContextText(queueContext.title) ||
      normalizeQueueContextText(repeatedLocalizedTitle) ===
        normalizeQueueContextText(queueContext.title))
  )

  const handleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(dragY.value, [0, 90], [1, 0.72]),
    }
  })

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
        dragY.value = withSpring(0, {
          damping: 18,
          stiffness: 230,
        })

        if (shouldClose) {
          runOnJS(onClose)()
        }
      })
  )

  return (
    <View className="relative mt-2 min-h-16 justify-center">
      <View className="absolute left-0 z-20 p-1">
        <CastButton style={{ width: 24, height: 24, tintColor: "white" }} />
      </View>

      <GestureDetector gesture={handleGesture}>
        <Animated.View className="absolute -top-4 z-10 self-center px-6 py-4" style={handleStyle}>
          <View className="h-1.5 w-12 rounded-full bg-white/40" />
        </Animated.View>
      </GestureDetector>

      {onOpenMore ? (
        <PressableFeedback onPress={onOpenMore} className="absolute right-0 z-20 p-1">
          <LocalMoreHorizontalCircleSolidIcon fill="none" width={24} height={24} color="white" />
        </PressableFeedback>
      ) : null}

      {queueContext ? (
        <View className="mx-10 items-center px-2 pt-5">
          <Text
            className="text-center text-[10px] font-semibold uppercase text-white/65"
            numberOfLines={1}
          >
            {shouldUseDefaultLabel ? t("player.playingFrom.default") : queueContextLabel}
          </Text>
          <Text className="mt-0.5 text-center text-sm font-semibold text-white" numberOfLines={1}>
            {queueContext.title}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
