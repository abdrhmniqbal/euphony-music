import * as React from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { getPreferenceState } from "@/core/preferences/store"
import { useViewPreferenceStore } from "@/core/preferences/view-store"
import { sortTracks } from "@/domains/tracks/sort"
import { toPlayerTracks } from "@/playback/player-track"
import { playTrackList, shuffleTrackList } from "@/playback/track-list-actions"
import { useTracks } from "@/domains/tracks/queries"

interface TracksTabProps {
  contentBottomPadding?: number
}

export function TracksTab({ contentBottomPadding = 0 }: TracksTabProps) {
  const { t } = useTranslation()
  const autoHideScrollProps = useAutoHideHeaderScroll()
  const trackOrder = useViewPreferenceStore((state) => state.trackOrder)
  const trackIsAsc = useViewPreferenceStore((state) => state.trackIsAsc)
  const { data: dbTracks = [] } = useTracks()
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const sortedTracks = useMemo(
    () => sortTracks(dbTracks, trackOrder, trackIsAsc),
    [dbTracks, trackOrder, trackIsAsc]
  )

  const playerTracks = useMemo(
    () => toPlayerTracks(sortedTracks, splitConfig),
    [sortedTracks, splitConfig]
  )

  return (
    <View className="flex-1 px-4">
      <PlaybackActionsRow
        onPlay={() => playTrackList(playerTracks, t("library.tracks"))}
        onShuffle={() => shuffleTrackList(playerTracks, t("library.tracks"))}
        className="mb-4"
      />
      <TrackList
        data={playerTracks}
        queueContext={{ type: "trackList", title: t("library.tracks") }}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        {...autoHideScrollProps}
      />
    </View>
  )
}
