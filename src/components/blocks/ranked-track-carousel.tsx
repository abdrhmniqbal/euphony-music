import * as React from "react"

import { View } from "react-native"

import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { useCurrentTrackId } from "@/playback/selectors"
import { playTrack } from "@/playback/service"
import { chunkArray } from "@/lib/array"

import { MediaCarousel } from "@/components/blocks/media-carousel"
import type { PlayerTrack, PlaybackQueueContext } from "@/playback/types"
import type { EmptyStateConfig } from "@/components/ui/empty-state"

interface RankedTrackCarouselProps {
  data: PlayerTrack[]
  chunkSize?: number
  emptyState?: EmptyStateConfig
  onItemPress?: (track: PlayerTrack) => void
  queueContext?: PlaybackQueueContext | null
  className?: string
}

interface RankedTrackChunkProps {
  chunk: PlayerTrack[]
  chunkIndex: number
  chunkSize: number
  currentTrackId?: string
  onTrackPress: (track: PlayerTrack) => void
}

function RankedTrackChunk({
  chunk,
  chunkIndex,
  chunkSize,
  currentTrackId,
  onTrackPress,
}: RankedTrackChunkProps) {
  return (
    <View style={{ width: 300 }}>
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
  queueContext,
  className,
}: RankedTrackCarouselProps) {
  const currentTrackId = useCurrentTrackId()

  const chunks = React.useMemo(() => chunkArray(data, chunkSize), [data, chunkSize])

  const handlePress = React.useCallback(
    (track: PlayerTrack) => {
      if (onItemPress) {
        onItemPress(track)
        return
      }

      playTrack(track, data, queueContext ?? undefined)
    },
    [data, onItemPress, queueContext]
  )

  return (
    <>
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
    </>
  )
}
