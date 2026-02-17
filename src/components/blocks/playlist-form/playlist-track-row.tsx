import { Checkbox } from "heroui-native"

import { TrackRow } from "@/components/patterns"

import type { PlaylistTrackRowProps } from "./types"

export function PlaylistTrackRow({
  track,
  isSelected,
  onPress,
}: PlaylistTrackRowProps) {
  return (
    <TrackRow
      track={track}
      onPress={onPress}
      className="py-2"
      leftAction={
        <Checkbox
          variant="secondary"
          isSelected={isSelected}
          onSelectedChange={() => onPress()}
          accessibilityLabel={`Select ${track.title}`}
          className="mt-0.5"
        />
      }
    />
  )
}
