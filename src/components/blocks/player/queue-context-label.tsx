import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import type { PlaybackQueueContext } from "@/playback/types"

const PLAYER_QUEUE_CONTEXT_LABEL_KEYS: Record<PlaybackQueueContext["type"], string> = {
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

const PLAYER_QUEUE_CONTEXT_TITLE_KEYS: Partial<Record<PlaybackQueueContext["type"], string>> = {
  favorites: "library.favorites",
  folder: "library.folders",
  genre: "library.genres",
  playlist: "library.playlists",
  search: "navigation.tabs.search",
  trackList: "library.tracks",
}

function normalizeQueueContextText(value: string) {
  return value.trim().toLowerCase()
}

interface QueueContextLabelProps {
  queueContext: PlaybackQueueContext | null
}

export const QueueContextLabel: React.FC<QueueContextLabelProps> = ({ queueContext }) => {
  const { t } = useTranslation()

  if (!queueContext) {
    return null
  }

  const queueContextLabel = t(PLAYER_QUEUE_CONTEXT_LABEL_KEYS[queueContext.type])
  const labelSuffix = queueContextLabel.replace(t("player.playingFrom.default"), "")
  const repeatedTitleKey = PLAYER_QUEUE_CONTEXT_TITLE_KEYS[queueContext.type]
  const repeatedLocalizedTitle = repeatedTitleKey ? t(repeatedTitleKey) : ""
  const shouldUseDefaultLabel = Boolean(
    normalizeQueueContextText(labelSuffix) === normalizeQueueContextText(queueContext.title) ||
    normalizeQueueContextText(repeatedLocalizedTitle) ===
      normalizeQueueContextText(queueContext.title)
  )

  return (
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
  )
}
