import { useMemo, useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import LocalClock01SolidIcon from "@/components/icons/local/clock-01-solid"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import { BackButton } from "@/components/patterns/back-button"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { getPreferenceState } from "@/core/preferences/store"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { startIndexing } from "@/domains/indexer/service"
import { toPlayerTracks } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"
import { createPlaybackQueueContext } from "@/playback/types"
import { useCurrentTrackId } from "@/playback/selectors"
import { playTrack } from "@/playback/service"
import { useTracks } from "@/domains/tracks/queries"

const RECENTLY_ADDED_SCREEN_LIMIT = 50

export function RecentlyAddedScreen() {
  const { t } = useTranslation()
  const currentTrackId = useCurrentTrackId()
  const insets = useSafeAreaInsets()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: tracksData = [], isLoading, isFetching, refetch } = useTracks()

  const tracks = useMemo(
    () =>
      toPlayerTracks(tracksData, getPreferenceState().splitMultipleValueConfig)
        .filter((track) => track.uri !== "")
        .sort((a, b) => (b.dateAdded ?? 0) - (a.dateAdded ?? 0))
        .slice(0, RECENTLY_ADDED_SCREEN_LIMIT),
    [tracksData]
  )

  async function refresh() {
    try {
      setIsRefreshing(true)
      await startIndexing(false, false)
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const queueContext = createPlaybackQueueContext("trackList", t("search.recentlyAdded"))

  function playFirst() {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, queueContext)
    }
  }

  function shuffle() {
    if (tracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks, queueContext)
  }

  function playRecentlyAddedTrack(track: PlayerTrack) {
    playTrack(track, tracks, queueContext)
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <BackButton className="-ml-2" fallbackHref="/(main)/(search)" />
        <Text className="ml-2 flex-1 text-xl font-bold text-foreground" numberOfLines={1}>
          {t("search.recentlyAdded")}
        </Text>
      </View>
      {tracks.length === 0 ? (
        <EmptyState
          icon={<LocalClock01SolidIcon fill="none" width={48} height={48} color="#9ca3af" />}
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
              refreshing={isLoading || isFetching || isRefreshing}
              onRefresh={() => void refresh()}
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
