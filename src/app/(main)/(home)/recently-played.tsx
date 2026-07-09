/**
 * Purpose: Renders the Recently Played route with playback actions and a full history list.
 * Caller: Home stack nested route.
 * Dependencies: history query, react-i18next, track playback service, themed refresh control, theme colors.
 * Main Functions: RecentlyPlayedScreen()
 * Side Effects: Starts indexing on refresh, updates scroll state, and starts context-aware playback.
 */

import { View } from "react-native"
import { useTranslation } from "react-i18next"

import { PlaybackActionsRow } from "@/modules/player/ui/playback-actions-row"
import { TrackList } from "@/modules/tracks/ui/track-list"
import LocalClock01SolidIcon from "@/modules/shared/components/icons/local/clock-01-solid"
import { EmptyState } from "@/modules/shared/components/ui/empty-state"
import { ThemedRefreshControl } from "@/modules/shared/components/ui/themed-refresh-control"
import { useRecentlyPlayedTracks } from "@/modules/history/queries"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useThemeColors } from "@/modules/ui/theme"
import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"

const RECENTLY_PLAYED_SCREEN_LIMIT = 50

export default function RecentlyPlayedScreen() {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const currentTrackId = useCurrentTrackId()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const {
    data: historyData,
    isLoading,
    isFetching,
    refetch,
  } = useRecentlyPlayedTracks(RECENTLY_PLAYED_SCREEN_LIMIT)

  const history = historyData ?? []

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function playFirst() {
    if (history.length === 0) {
      return
    }

    playTrack(history[0], history, {
      type: "trackList",
      title: t("home.recentlyPlayed"),
    })
  }

  function shuffle() {
    if (history.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * history.length)
    playTrack(history[randomIndex], history, {
      type: "trackList",
      title: t("home.recentlyPlayed"),
    })
  }

  function playHistoryTrack(track: (typeof history)[number]) {
    playTrack(track, history, {
      type: "trackList",
      title: t("home.recentlyPlayed"),
    })
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

  return (
    <View className="flex-1 bg-background">
      {history.length === 0 ? (
        <EmptyState
          icon={<LocalClock01SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
          title={t("home.empty.recentlyPlayedTitle")}
          message={t("home.empty.recentlyPlayedLongMessage")}
          className="mt-12 px-4"
        />
      ) : (
        <TrackList
          data={history}
          onTrackPress={playHistoryTrack}
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
