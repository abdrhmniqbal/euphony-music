import type { LegendListRenderItemProps } from "@legendapp/list/react-native"
import { LegendList } from "@legendapp/list/react-native"
import * as React from "react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { EmptyState } from "@/components/ui/empty-state"
import { TrackRow } from "@/components/patterns/track-row"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { getPreferenceState } from "@/core/preferences/store"
import { useViewPreferenceStore } from "@/core/preferences/view-store"
import { sortTracks } from "@/domains/tracks/sort"
import { toPlayerTrack } from "@/playback/player-track"
import {
  playSingleTrackFromList,
  playTrackList,
  shuffleTrackList,
} from "@/playback/track-list-actions"
import { useTracks } from "@/domains/tracks/queries"
import type { DataTrack } from "@/domains/tracks/types"

interface TracksTabProps {
  contentBottomPadding?: number
}

export function TracksTab({ contentBottomPadding = 0 }: TracksTabProps) {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const autoHideScrollProps = useAutoHideHeaderScroll()
  const trackOrder = useViewPreferenceStore((state) => state.trackOrder)
  const trackIsAsc = useViewPreferenceStore((state) => state.trackIsAsc)
  const { data: dbTracks = [] } = useTracks()
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const sortedTracks = useMemo(
    () => sortTracks(dbTracks, trackOrder, trackIsAsc),
    [dbTracks, trackOrder, trackIsAsc]
  )

  const handleTrackPress = useCallback(
    (track: DataTrack) => {
      playSingleTrackFromList(track, sortedTracks, t("library.tracks"))
    },
    [sortedTracks, t]
  )

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<DataTrack>) => (
      <TrackRow track={toPlayerTrack(item, splitConfig)!} onPress={() => handleTrackPress(item)} />
    ),
    [handleTrackPress, splitConfig]
  )

  return (
    <View className="flex-1 px-4">
      <PlaybackActionsRow
        onPlay={() => playTrackList(sortedTracks, t("library.tracks"))}
        onShuffle={() => shuffleTrackList(sortedTracks, t("library.tracks"))}
        className="mb-4"
      />
      <LegendList
        data={sortedTracks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={{ flex: 1, minHeight: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        ListEmptyComponent={
          <EmptyState
            icon={
              <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
            }
            title={t("library.empty.tracksTitle")}
            message={t("library.empty.tracksMessage")}
          />
        }
        recycleItems
        estimatedItemSize={84}
        drawDistance={200}
        {...autoHideScrollProps}
      />
    </View>
  )
}
