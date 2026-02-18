import * as React from "react"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list"
import { useStore } from "@nanostores/react"
import { PressableFeedback } from "heroui-native"
import { Text, View } from "react-native"
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated"
import { cn } from "tailwind-variants"

import { playTrack, type Track } from "@/modules/player/player.store"
import { $queueInfo, removeFromQueue } from "@/modules/player/queue.store"
import LocalCancelIcon from "@/components/icons/local/cancel"
import { TrackRow } from "@/components/patterns"

interface QueueItemProps {
  track: Track
  isCurrentTrack: boolean
  isPlayedTrack: boolean
  onPress: () => void
  onRemove: () => void
}

export const QueueItem: React.FC<QueueItemProps> = ({
  track,
  isCurrentTrack,
  isPlayedTrack,
  onPress,
  onRemove,
}) => (
  <TrackRow
    track={track}
    onPress={onPress}
    className={cn(
      "rounded-xl px-2",
      isCurrentTrack ? "bg-white/10" : "active:bg-white/5",
      isPlayedTrack && "opacity-45"
    )}
    imageClassName="h-12 w-12 bg-white/10"
    titleClassName={isCurrentTrack ? "text-white" : "text-white/90"}
    descriptionClassName="text-white/50 text-sm"
    rightAction={
      <View className="flex-row items-center">
        {!isCurrentTrack ? (
          <PressableFeedback
            onPress={(event) => {
              event.stopPropagation()
              onRemove()
            }}
            className="p-2 opacity-60"
          >
            <LocalCancelIcon fill="none" width={24} height={24} color="white" />
          </PressableFeedback>
        ) : null}
      </View>
    }
  />
)

interface QueueViewProps {
  currentTrack: Track | null
}

export const QueueView: React.FC<QueueViewProps> = ({ currentTrack }) => {
  const queueInfo = useStore($queueInfo)
  const { queue, upNext, currentIndex } = queueInfo

  if (!currentTrack || queue.length === 0) return null

  const handleRemove = async (trackId: string) => {
    await removeFromQueue(trackId)
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
          Up Next • {upNext.length} {upNext.length === 1 ? "track" : "tracks"}
        </Text>
      </View>
      <View className="flex-1">
        <LegendList
          data={queue}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item, index }: LegendListRenderItemProps<Track>) => (
            <QueueItem
              track={item}
              isCurrentTrack={item.id === currentTrack.id}
              isPlayedTrack={currentIndex >= 0 && index < currentIndex}
              onPress={() => playTrack(item, queue)}
              onRemove={() => handleRemove(item.id)}
            />
          )}
          style={{ flex: 1, minHeight: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 4, paddingBottom: 20 }}
          recycleItems={true}
          initialContainerPoolRatio={2.5}
          estimatedItemSize={72}
          drawDistance={180}
        />
      </View>
    </Animated.View>
  )
}
