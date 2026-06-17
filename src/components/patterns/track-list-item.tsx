/**
 * Purpose: Renders an individual track row with playback state styling and row actions.
 * Caller: TrackList virtualized renderer.
 * Dependencies: track row UI, player current-track selector, action icon components.
 * Main Functions: MemoizedTrackListItem
 * Side Effects: Triggers playback and row action callbacks.
 */

import type { Track } from "@/modules/player/store"
import { PressableFeedback } from "heroui-native"
import * as React from "react"

import { useCallback } from "react"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { usePlayerStore } from "@/modules/player/store"

interface TrackListItemProps {
  track: Track
  index: number
  data: Track[]
  mutedColor: string
  showNumbers: boolean
  hideCover: boolean
  hideArtist: boolean
  getNumber?: (track: Track, index: number) => number | string
  onTrackPress: (track: Track) => void
  onTrackLongPress: (track: Track) => void
  renderItemPrefix?: (track: Track, index: number, data: Track[]) => React.ReactNode
}

function TrackListItem({
  track,
  index,
  data,
  mutedColor,
  showNumbers,
  hideCover,
  hideArtist,
  getNumber,
  onTrackPress,
  onTrackLongPress,
  renderItemPrefix,
}: TrackListItemProps) {
  const isCurrentTrack = usePlayerStore((state) => state.currentTrack?.id === track.id)

  const handleActionPress = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation()
      onTrackLongPress(track)
    },
    [onTrackLongPress, track]
  )
  const handlePress = useCallback(() => {
    onTrackPress(track)
  }, [onTrackPress, track])
  const handleLongPress = useCallback(() => {
    onTrackLongPress(track)
  }, [onTrackLongPress, track])
  const rank = showNumbers ? (getNumber ? getNumber(track, index) : index + 1) : undefined

  return (
    <>
      {renderItemPrefix?.(track, index, data) || null}
      <TrackRow
        track={track}
        onPress={handlePress}
        onLongPress={handleLongPress}
        rank={rank}
        showCover={!hideCover}
        showArtist={!hideArtist}
        titleClassName={isCurrentTrack ? "text-accent" : undefined}
        imageOverlay={isCurrentTrack ? <ScaleLoader size={16} /> : undefined}
        rightAction={
          <PressableFeedback onPress={handleActionPress} className="p-2">
            <LocalMoreHorizontalCircleSolidIcon
              fill="none"
              width={24}
              height={24}
              color={mutedColor}
            />
          </PressableFeedback>
        }
      />
    </>
  )
}

export const MemoizedTrackListItem = React.memo(TrackListItem)
