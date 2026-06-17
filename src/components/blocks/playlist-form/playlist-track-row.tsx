import type { PlaylistTrackRowProps } from "./types"

import { Checkbox } from "heroui-native"
import { useTranslation } from "react-i18next"

import { TrackRow } from "@/components/patterns/track-row"

export function PlaylistTrackRow({ track, isSelected, onPress }: PlaylistTrackRowProps) {
  const { t } = useTranslation()

  return (
    <TrackRow
      track={track}
      onPress={onPress}
      className="w-full py-2"
      leftAction={
        <Checkbox
          variant="secondary"
          isSelected={isSelected}
          onSelectedChange={() => onPress()}
          accessibilityLabel={t("playlist.selectTrack", {
            title: track.title,
          })}
          className="mt-0.5"
        />
      }
    />
  )
}
