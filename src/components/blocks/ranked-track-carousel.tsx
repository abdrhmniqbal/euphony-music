import type { ReactNode } from "react"
import type { PlayerQueueContext, Track } from "@/modules/player/types"
import * as React from "react"

import { View } from "react-native"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { chunkArray } from "@/utils/array"

import { MediaCarousel } from "./media-carousel"
import { useActionSheet } from "@/components/blocks/use-action-sheet"
import { TrackActionSheet } from "./sheets/track-action-sheet"

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
  onItemLongPress?: (track: Track) => void
  queueContext?: PlayerQueueContext | null
  className?: string
}

interface RankedTrackChunkProps {
  chunk: Track[]
  chunkIndex: number
  chunkSize: number
  currentTrackId?: string
  onTrackPress: (track: Track) => void
  onTrackLongPress?: (track: Track) => void
}

function RankedTrackChunk({
  chunk,
  chunkIndex,
  chunkSize,
  currentTrackId,
  onTrackPress,
  onTrackLongPress,
}: RankedTrackChunkProps) {
  return (
    <View className="w-75">
      {chunk.map((track, index) => (
        <TrackRow
          key={track.id}
          track={track}
          rank={chunkIndex * chunkSize + index + 1}
          onPress={() => onTrackPress(track)}
          onLongPress={() => onTrackLongPress?.(track)}
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
  onItemLongPress,
  queueContext,
  className,
}: RankedTrackCarouselProps) {
  const currentTrackId = useCurrentTrackId()
  const { selected: selectedTrack, isOpen: isSheetOpen, handleLongPress: selectAndOpenSheet, closeSheet } = useActionSheet<Track>()

  const chunks = React.useMemo(() => chunkArray(data, chunkSize), [data, chunkSize])

  const handlePress = React.useCallback(
    (track: Track) => {
      if (onItemPress) {
        onItemPress(track)
        return
      }

      playTrack(track, data, queueContext ?? undefined)
    },
    [data, onItemPress, queueContext]
  )

  const handleLongPress = React.useCallback(
    (track: Track) => {
      if (onItemLongPress) {
        onItemLongPress(track)
        return
      }
      selectAndOpenSheet(track)
    },
    [onItemLongPress, selectAndOpenSheet]
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
            onTrackLongPress={handleLongPress}
          />
        )}
      />
      <TrackActionSheet
        track={selectedTrack}
        isOpen={isSheetOpen}
        onClose={() => {
          closeSheet()
        }}
        tracks={data}
        queueContext={queueContext ?? null}
      />
    </>
  )
}
