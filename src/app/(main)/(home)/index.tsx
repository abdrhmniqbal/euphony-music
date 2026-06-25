/**
 * Purpose: Renders the Home landing screen with recently played and top tracks previews using full-context playback queues.
 * Caller: Expo Router home tab.
 * Dependencies: history queries, react-i18next, track playback service, themed refresh control, theme colors.
 * Main Functions: HomeScreen()
 * Side Effects: Starts indexing on refresh, updates scroll state, and starts playback from full section queues.
 */

import type { Track } from "@/modules/player/types"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import * as React from "react"

import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { ContentSection } from "@/components/blocks/content-section"
import { MediaCarousel } from "@/components/blocks/media-carousel"
import { RankedTrackCarousel } from "@/components/blocks/ranked-track-carousel"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import LocalClock01SolidIcon from "@/components/icons/local/clock-01-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { SCREEN_SECTION_TOP_SPACING } from "@/constants/layout"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { useRecentlyPlayedTracks, useTopTracksByPeriod } from "@/modules/history/queries"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useThemeColors } from "@/modules/ui/theme"
import { handleScroll, handleScrollStart, handleScrollStop } from "@/modules/ui/store"
import { createTrackListQueueContext, type PlaybackQueueContext } from "@/stores/playback/types"

const CHUNK_SIZE = 5
const RECENTLY_PLAYED_PREVIEW_LIMIT = 8
const RECENTLY_PLAYED_QUEUE_LIMIT = 50
const TOP_TRACKS_PREVIEW_LIMIT = 25
const TOP_TRACKS_QUEUE_LIMIT = 50

export default function HomeScreen() {
  const router = useRouter()
  const theme = useThemeColors()
  const { t } = useTranslation()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const currentTrackId = useCurrentTrackId()
  const [selectedPlaybackAction, setSelectedPlaybackAction] = React.useState<{
    track: Track
    tracks: Track[]
    queueContext: PlaybackQueueContext
  } | null>(null)
  const [isTrackSheetOpen, setIsTrackSheetOpen] = React.useState(false)
  const {
    data: recentlyPlayedTracksData,
    isLoading: isRecentlyPlayedLoading,
    isFetching: isRecentlyPlayedFetching,
    refetch: refetchRecentlyPlayedTracks,
  } = useRecentlyPlayedTracks(RECENTLY_PLAYED_QUEUE_LIMIT)
  const {
    data: topTracksData,
    isLoading: isTopTracksLoading,
    isFetching: isTopTracksFetching,
    refetch: refetchTopTracks,
  } = useTopTracksByPeriod("all", TOP_TRACKS_QUEUE_LIMIT)

  const recentlyPlayedTracks = recentlyPlayedTracksData ?? []
  const topTracks = topTracksData ?? []
  const recentlyPlayedPreviewTracks = recentlyPlayedTracks.slice(0, RECENTLY_PLAYED_PREVIEW_LIMIT)
  const topPreviewTracks = topTracks.slice(0, TOP_TRACKS_PREVIEW_LIMIT)
  const isLoading =
    (isRecentlyPlayedLoading ||
      isRecentlyPlayedFetching ||
      isTopTracksLoading ||
      isTopTracksFetching) &&
    recentlyPlayedTracks.length === 0 &&
    topTracks.length === 0

  async function refresh() {
    await startIndexing(false)
    await Promise.all([refetchRecentlyPlayedTracks(), refetchTopTracks()])
  }

  const openTrackSheet = React.useCallback((track: Track, tracks: Track[], title: string) => {
    setSelectedPlaybackAction({
      track,
      tracks,
      queueContext: createTrackListQueueContext(title),
    })
    setIsTrackSheetOpen(true)
  }, [])

  function renderRecentlyPlayedItem(item: Track) {
    return (
      <TrackRow
        track={item}
        variant="grid"
        onPress={() =>
          playTrack(item, recentlyPlayedTracks, {
            type: "trackList",
            title: t("home.recentlyPlayed"),
          })
        }
        onLongPress={() => openTrackSheet(item, recentlyPlayedTracks, t("home.recentlyPlayed"))}
        titleClassName={currentTrackId === item.id ? "text-accent" : undefined}
        imageOverlay={currentTrackId === item.id ? <ScaleLoader size={16} /> : undefined}
      />
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 220 }}
      contentInsetAdjustmentBehavior="automatic"
      onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
      onScrollBeginDrag={handleScrollStart}
      onMomentumScrollEnd={handleScrollStop}
      onScrollEndDrag={handleScrollStop}
      scrollEventThrottle={16}
      refreshControl={
        <ThemedRefreshControl refreshing={isIndexing || isLoading} onRefresh={refresh} />
      }
    >
      <View style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}>
        <ContentSection
          title={t("home.recentlyPlayed")}
          data={recentlyPlayedPreviewTracks}
          onViewMore={() => router.push("/(main)/(home)/recently-played")}
          emptyState={{
            icon: <LocalClock01SolidIcon fill="none" width={48} height={48} color={theme.muted} />,
            title: t("home.empty.recentlyPlayedTitle"),
            message: t("home.empty.recentlyPlayedMessage"),
          }}
          renderContent={(data) => (
            <MediaCarousel
              data={data}
              renderItem={renderRecentlyPlayedItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              gap={10}
              dataVersionKey={currentTrackId ?? undefined}
            />
          )}
        />

        <ContentSection
          title={t("home.topTracks")}
          data={topPreviewTracks}
          onViewMore={() => router.push("/(main)/(home)/top-tracks")}
          emptyState={{
            icon: (
              <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
            ),
            title: t("home.empty.topTracksTitle"),
            message: t("home.empty.topTracksMessage"),
          }}
          renderContent={(data) => (
            <RankedTrackCarousel
              data={data}
              chunkSize={CHUNK_SIZE}
              onItemPress={(track) =>
                playTrack(track, topTracks, {
                  type: "trackList",
                  title: t("home.topTracks"),
                })
              }
              onItemLongPress={(track) => openTrackSheet(track, topTracks, t("home.topTracks"))}
            />
          )}
        />
      </View>
      <TrackActionSheet
        track={selectedPlaybackAction?.track ?? null}
        isOpen={isTrackSheetOpen}
        onClose={() => {
          setIsTrackSheetOpen(false)
          setSelectedPlaybackAction(null)
        }}
        tracks={selectedPlaybackAction?.tracks ?? []}
        queueContext={selectedPlaybackAction?.queueContext ?? null}
      />
    </ScrollView>
  )
}
