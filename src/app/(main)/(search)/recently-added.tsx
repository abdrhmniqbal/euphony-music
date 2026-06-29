/**
 * Purpose: Renders the full Recently Added route from the Search tab.
 * Caller: Search screen's View More action.
 * Dependencies: track query sorted by dateAdded, react-i18next, DB-to-playback track transform, playback actions, themed refresh control, theme colors.
 * Main Functions: RecentlyAddedScreen()
 * Side Effects: Starts indexing on refresh, updates scroll state, and starts context-aware playback.
 */

import { useMemo } from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"

import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalClock01SolidIcon from "@/components/icons/local/clock-01-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { useIndexerStore } from "@/modules/indexer/store"
import { startIndexing } from "@/modules/indexer/service"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useTracks } from "@/modules/tracks/queries"
import { useThemeColors } from "@/modules/ui/theme"
import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"
import { transformDBTrackToTrack } from "@/utils/transformers"
import type { DBTrack } from "@/types/database"

const RECENTLY_ADDED_SCREEN_LIMIT = 50

export default function RecentlyAddedScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const currentTrackId = useCurrentTrackId()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const {
    data: tracksData = [],
    isLoading,
    isFetching,
    refetch,
  } = useTracks({
    sortBy: "dateAdded",
    sortOrder: "desc",
  })

  const tracks = useMemo(
    () =>
      (tracksData as DBTrack[]).map(transformDBTrackToTrack).slice(0, RECENTLY_ADDED_SCREEN_LIMIT),
    [tracksData]
  )

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function playFirst() {
    if (tracks.length === 0) {
      return
    }

    playTrack(tracks[0], tracks, {
      type: "trackList",
      title: t("search.recentlyAdded"),
    })
  }

  function shuffle() {
    if (tracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks, {
      type: "trackList",
      title: t("search.recentlyAdded"),
    })
  }

  function playRecentlyAddedTrack(track: (typeof tracks)[number]) {
    playTrack(track, tracks, {
      type: "trackList",
      title: t("search.recentlyAdded"),
    })
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

  return (
    <View className="flex-1 bg-background">
      {tracks.length === 0 ? (
        <EmptyState
          icon={<LocalClock01SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
          title={t("search.empty.recentlyAddedTitle")}
          message={t("search.empty.recentlyAddedMessage")}
          className="mt-12 px-4"
        />
      ) : (
        <TrackList
          data={tracks}
          onTrackPress={playRecentlyAddedTrack}
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          currentTrackId={currentTrackId ?? undefined}
          {...autoHideScrollProps}
          refreshControl={
            <ThemedRefreshControl
              refreshing={isIndexing || isLoading || isFetching}
              onRefresh={refresh}
            />
          }
          listHeader={
            <PlaybackActionsRow onPlay={playFirst} onShuffle={shuffle} className="mb-2 px-0 py-0" />
          }
        />
      )}
    </View>
  )
}
