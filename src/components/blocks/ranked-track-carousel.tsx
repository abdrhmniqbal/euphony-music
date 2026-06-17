import type { ReactNode } from "react"
import type { Track } from "@/modules/player/store"
import * as React from "react"

import { View } from "react-native"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { chunkArray } from "@/utils/array"

import { MediaCarousel } from "./media-carousel"

interface EmptyStateConfig {
  icon: ReactNode
  title: string
  message: string
}

interface RankedTrackCarouselProps {
  data: Track[]
  chunkSize?: number
  emptyState?: EmptyStateConfig
  onItemPress?: (track: Track) => void
  className?: string
}

interface RankedTrackChunkProps {
  chunk: Track[]
  chunkIndex: number
  chunkSize: number
  currentTrackId?: string
  onTrackPress: (track: Track) => void
}

function RankedTrackChunk({
  chunk,
  chunkIndex,
  chunkSize,
  currentTrackId,
  onTrackPress,
}: RankedTrackChunkProps) {
  return (
    <View className="w-75">
      {chunk.map((track, index) => (
        <TrackRow
          key={track.id}
          track={track}
          rank={chunkIndex * chunkSize + index + 1}
          onPress={() => onTrackPress(track)}
          titleClassName={currentTrackId === track.id ? "text-accent" : undefined}
          imageOverlay={currentTrackId === track.id ? <ScaleLoader size={16} /> : undefined}
        />
      ))}
    </View>
  )
}

const MemoizedRankedTrackChunk = React.memo(RankedTrackChunk)

export function RankedTrackCarousel({
  data,
  chunkSize = 5,
  emptyState,
  onItemPress,
  className,
}: RankedTrackCarouselProps) {
  const currentTrackId = useCurrentTrackId()
  const chunks = React.useMemo(() => chunkArray(data, chunkSize), [data, chunkSize])

  const handlePress = React.useCallback(
    (track: Track) => {
      if (onItemPress) {
        onItemPress(track)
        return
      }

      playTrack(track, data)
    },
    [data, onItemPress]
  )

  return (
    <MediaCarousel
      data={chunks}
      keyExtractor={(_, index) => `chunk-${index}`}
      emptyState={emptyState}
      gap={24}
      className={className}
      renderItem={(chunk, chunkIndex) => (
        <MemoizedRankedTrackChunk
          chunk={chunk}
          chunkIndex={chunkIndex}
          chunkSize={chunkSize}
          currentTrackId={currentTrackId}
          onTrackPress={handlePress}
        />
      )}
    />
  )
}
