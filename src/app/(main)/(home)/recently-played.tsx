import { useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalClock01SolidIcon from "@/components/icons/local/clock-01-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { BackButton } from "@/components/patterns/back-button"
import { useRecentlyPlayedTracks } from "@/domains/history/repository"
import { startIndexing } from "@/domains/indexer/service"
import { useCurrentTrackId } from "@/playback/selectors"
import { playTrack } from "@/playback/service"
import { createPlaybackQueueContext, type PlayerTrack } from "@/playback/types"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"

const RECENTLY_PLAYED_SCREEN_LIMIT = 50

export default function RecentlyPlayedScreen() {
  const { t } = useTranslation()
  const currentTrackId = useCurrentTrackId()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const {
    data: historyData,
    isLoading,
    isFetching,
    refetch,
  } = useRecentlyPlayedTracks(RECENTLY_PLAYED_SCREEN_LIMIT)

  const history = (historyData ?? []).filter((track) => track.uri !== "")

  async function refresh() {
    try {
      setIsRefreshing(true)
      await startIndexing(false, false)
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const queueContext = createPlaybackQueueContext("trackList", t("home.recentlyPlayed"))

  function playFirst() {
    if (history.length > 0) {
      playTrack(history[0], history, queueContext)
    }
  }

  function shuffle() {
    if (history.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * history.length)
    playTrack(history[randomIndex], history, queueContext)
  }

  function playHistoryTrack(track: PlayerTrack) {
    playTrack(track, history, queueContext)
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

  if (history.length === 0) {
    return (
      <View className="flex-1 bg-background px-4 pt-16">
        <BackButton className="-ml-2" fallbackHref="/(main)/(home)" />
        <EmptyState
          icon={<LocalClock01SolidIcon fill="none" width={48} height={48} color="#9ca3af" />}
          title={t("home.empty.recentlyPlayedTitle")}
          message={t("home.empty.recentlyPlayedLongMessage")}
          className="mt-12 px-4"
        />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="flex-row items-center px-4 pb-3">
        <BackButton className="-ml-2" fallbackHref="/(main)/(home)" />
        <Text className="ml-2 flex-1 text-xl font-bold text-foreground" numberOfLines={1}>
          {t("home.recentlyPlayed")}
        </Text>
      </View>
      <TrackList
        data={history}
        onTrackPress={playHistoryTrack}
        contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
        currentTrackId={currentTrackId ?? undefined}
        {...autoHideScrollProps}
        refreshControl={
          <ThemedRefreshControl
            refreshing={isLoading || isFetching}
            onRefresh={() => void refresh()}
          />
        }
        listHeader={
          <PlaybackActionsRow onPlay={playFirst} onShuffle={shuffle} className="mb-2 px-0 py-0" />
        }
      />
    </View>
  )
}
