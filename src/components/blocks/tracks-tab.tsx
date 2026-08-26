import * as React from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { LibraryListHeader } from "@/components/blocks/library-list-header"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { getPreferenceState } from "@/core/preferences/store"
import { resolveSortLabel, TRACK_TAB_SORT_OPTIONS } from "@/domains/library/sort-constants"
import { setSortConfig, useLibrarySortStore } from "@/domains/library/sort-store"
import { sortPlayerTracks } from "@/domains/tracks/detail-sort"
import { toPlayerTracks } from "@/playback/player-track"
import { playTrackList, shuffleTrackList } from "@/playback/track-list-actions"
import { useTracks } from "@/domains/tracks/queries"

interface TracksTabProps {
  contentBottomPadding?: number
}

export function TracksTab({ contentBottomPadding = 0 }: TracksTabProps) {
  const { t } = useTranslation()
  const autoHideScrollProps = useAutoHideHeaderScroll()
  const [showSortSheet, setShowSortSheet] = React.useState(false)
  const sortConfig = useLibrarySortStore((state) => state.sortConfig.TracksTab)
  const { data: dbTracks = [] } = useTracks()
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const playerTracks = useMemo(() => toPlayerTracks(dbTracks, splitConfig), [dbTracks, splitConfig])

  const sortedPlayerTracks = useMemo(
    () => sortPlayerTracks(playerTracks, sortConfig),
    [playerTracks, sortConfig]
  )

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={(field, order) => setSortConfig("TracksTab", field, order)}
    >
      <View className="flex-1 px-4">
        <PlaybackActionsRow
          onPlay={() => playTrackList(sortedPlayerTracks, t("library.tracks"))}
          onShuffle={() => shuffleTrackList(sortedPlayerTracks, t("library.tracks"))}
          className="mb-4"
        />
        {sortedPlayerTracks.length > 0 ? (
          <LibraryListHeader
            count={sortedPlayerTracks.length}
            sortLabel={t(
              resolveSortLabel(TRACK_TAB_SORT_OPTIONS, sortConfig.field) || "library.sortBy"
            )}
          />
        ) : null}
        <TrackList
          data={sortedPlayerTracks}
          queueContext={{ type: "trackList", title: t("library.tracks") }}
          contentContainerStyle={{ paddingBottom: contentBottomPadding }}
          {...autoHideScrollProps}
        />
      </View>
      <SortSheet.Content options={TRACK_TAB_SORT_OPTIONS} />
    </SortSheet>
  )
}
