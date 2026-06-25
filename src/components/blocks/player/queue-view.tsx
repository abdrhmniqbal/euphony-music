/**
 * Purpose: Renders the player queue with drag-reorder controls and active-track highlighting.
 * Caller: full-player-content queue panel.
 * Dependencies: player selectors/store, queue service mutations, reorderable list UI.
 * Main Functions: QueueView(), MemoizedQueueItem
 * Side Effects: Reorders/removes queue entries and can trigger playback of selected queue item.
 */

import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { type FlatList, Text, View } from "react-native"
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated"
import ReorderableList, { useReorderableDrag } from "react-native-reorderable-list"
import { cn } from "tailwind-variants"

import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import LocalDragDropVerticalIcon from "@/components/icons/local/drag-drop-vertical"
import { TrackRow } from "@/components/patterns/track-row"
import { EmptyState } from "@/components/ui/empty-state"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { skipToQueueItem } from "@/modules/player/controls"
import { moveInQueue, removeFromQueue } from "@/modules/player/queue"
import { extractTrackId } from "@/stores/playback/utils"
import { usePlaybackStore } from "@/stores/playback/store"
import { useCurrentTrack, usePlayerQueueInfo } from "@/modules/player/selectors"
import { usePlayerStore } from "@/modules/player/store"

import { useQuery } from "@tanstack/react-query"
import { maybeGetTrack } from "@/modules/tracks/repository"
import { toPlayerTrack } from "@/modules/player/playback-subscriber"

interface QueueItemProps {
  trackKey: string
  index: number
  onPress: (index: number) => void
  onRemove: (trackId: string) => void
}

export const QueueItem: React.FC<QueueItemProps> = ({ trackKey, index, onPress, onRemove }) => {
  const trackId = extractTrackId(trackKey)
  const currentTrackState = usePlayerStore((state) => state.currentTrack)
  const currentIndex = usePlaybackStore((state) => state.queuePosition)
  const isCurrentTrack = index === currentIndex
  const isPlayedTrack = index < currentIndex

  const { data: dbTrack } = useQuery({
    queryKey: ["track", "queue-item", trackId],
    queryFn: async () => {
      const t = await maybeGetTrack(trackId)
      return t ? toPlayerTrack(t) : null
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const track = dbTrack ?? (isCurrentTrack ? currentTrackState : null)

  const drag = useReorderableDrag()
  const handleDragPress = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation()
      drag()
    },
    [drag]
  )
  const handleRemovePress = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation()
      onRemove(trackId)
    },
    [onRemove, trackId]
  )
  const handlePress = useCallback(() => {
    onPress(index)
  }, [onPress, index])

  if (!track) {
    return <View style={{ height: 64 }} className="justify-center px-4" />
  }

  return (
    <TrackRow
      track={track}
      onPress={handlePress}
      leftAction={
        <PressableFeedback onPressIn={handleDragPress} className="p-2 opacity-60">
          <LocalDragDropVerticalIcon fill="none" width={24} height={24} color="white" />
        </PressableFeedback>
      }
      className={cn(
        "rounded-xl px-2",
        isCurrentTrack ? "bg-white/10" : "active:bg-white/5",
        isPlayedTrack && "opacity-45"
      )}
      imageClassName="h-12 w-12 bg-white/10"
      imageOverlay={isCurrentTrack ? <ScaleLoader size={16} /> : undefined}
      titleClassName={isCurrentTrack ? "text-white" : "text-white/90"}
      descriptionClassName="text-white/50 text-sm"
      rightAction={
        <View className="flex-row items-center">
          {!isCurrentTrack ? (
            <PressableFeedback onPress={handleRemovePress} className="p-2 opacity-60">
              <LocalCancel01Icon fill="none" width={24} height={24} color="white" />
            </PressableFeedback>
          ) : null}
        </View>
      }
    />
  )
}

const MemoizedQueueItem = React.memo(QueueItem)

const ITEM_HEIGHT = 64
const ITEM_GAP = 6

export const QueueView: React.FC = () => {
  const { t } = useTranslation()
  const currentTrack = useCurrentTrack()
  const { queue, upNext, currentIndex } = usePlayerQueueInfo()
  const listRef = useRef<FlatList>(null)
  const handleRemove = useCallback(async (trackId: string) => {
    await removeFromQueue(trackId)
  }, [])
  const handleReorder = useCallback(({ from, to }: { from: number; to: number }) => {
    if (from === to) {
      return
    }
    void moveInQueue(from, to)
  }, [])
  const handlePlayFromQueue = useCallback((index: number) => {
    void skipToQueueItem(index)
  }, [])
  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <MemoizedQueueItem
        trackKey={item}
        index={index}
        onPress={handlePlayFromQueue}
        onRemove={handleRemove}
      />
    ),
    [handlePlayFromQueue, handleRemove]
  )
  if (!currentTrack || queue.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        layout={Layout.duration(300)}
        className="-mx-2 my-3 flex-1 justify-center"
      >
        <EmptyState
          title="No queue"
          message="Start playback to see upcoming tracks here."
          className="py-0"
        />
      </Animated.View>
    )
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      layout={Layout.duration(300)}
      className="-mx-2 my-3 flex-1 overflow-hidden"
    >
      <View className="mb-2 flex-row items-center justify-between px-2">
        <Text className="text-sm text-white/60">
          {t("player.upNext")} • {t("library.count.track", { count: upNext.length })}
        </Text>
      </View>
      <View className="flex-1">
        <ReorderableList
          ref={listRef}
          data={queue}
          keyExtractor={(item) => item}
          initialScrollIndex={currentIndex >= 0 ? currentIndex : undefined}
          onReorder={handleReorder}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: (ITEM_HEIGHT + ITEM_GAP) * index,
            index,
          })}
          style={{ flex: 1, minHeight: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: ITEM_GAP, paddingBottom: 20 }}
        />
      </View>
    </Animated.View>
  )
}
