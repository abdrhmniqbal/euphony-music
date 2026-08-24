import { useRouter } from "expo-router"
import * as React from "react"
import { useState } from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useThemeColor } from "heroui-native"

import LocalClock01SolidIcon from "@/components/icons/local/clock-01-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { ContentSection } from "@/components/blocks/content-section"
import { MediaCarousel } from "@/components/blocks/media-carousel"
import { RankedTrackCarousel } from "@/components/blocks/ranked-track-carousel"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { TrackRow } from "@/components/patterns/track-row"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { SCREEN_SECTION_TOP_SPACING } from "@/lib/layout"
import { useRecentlyPlayedTracks, useTopTracksByPeriod } from "@/domains/history/repository"
import { startIndexing } from "@/domains/indexer/service"
import { refreshIndexedMediaState } from "@/domains/indexer/utils/refresh"
import { useCurrentTrackId } from "@/playback/selectors"
import { playTrack } from "@/playback/service"
import type { PlayerTrack } from "@/playback/types"
import { createPlaybackQueueContext } from "@/playback/types"

const CHUNK_SIZE = 5
const RECENTLY_PLAYED_PREVIEW_LIMIT = 8
const RECENTLY_PLAYED_QUEUE_LIMIT = 50
const TOP_TRACKS_PREVIEW_LIMIT = 25
const TOP_TRACKS_QUEUE_LIMIT = 50

export function HomeScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const muted = useThemeColor("muted")
  const currentTrackId = useCurrentTrackId()
  const [selectedTrack, setSelectedTrack] = useState<PlayerTrack | null>(null)
  const [isTrackSheetOpen, setIsTrackSheetOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { data: recentlyPlayedTracksData, isLoading: isRecentlyPlayedLoading } =
    useRecentlyPlayedTracks(RECENTLY_PLAYED_QUEUE_LIMIT)
  const { data: topTracksData, isLoading: isTopTracksLoading } = useTopTracksByPeriod(
    "all",
    TOP_TRACKS_QUEUE_LIMIT
  )

  const recentlyPlayedTracks = React.useMemo(
    () => (recentlyPlayedTracksData ?? []).filter((t) => t.uri !== ""),
    [recentlyPlayedTracksData]
  )
  const topTracks = React.useMemo(
    () => (topTracksData ?? []).filter((t) => t.uri !== ""),
    [topTracksData]
  )
  const recentlyPlayedPreviewTracks = recentlyPlayedTracks.slice(0, RECENTLY_PLAYED_PREVIEW_LIMIT)
  const topPreviewTracks = topTracks.slice(0, TOP_TRACKS_PREVIEW_LIMIT)
  const isLoading = isRecentlyPlayedLoading || isTopTracksLoading || isRefreshing

  async function refresh() {
    try {
      setIsRefreshing(true)
      await startIndexing(false, false)
      await refreshIndexedMediaState()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 220 }}
      refreshControl={
        <ThemedRefreshControl refreshing={isLoading} onRefresh={() => void refresh()} />
      }
    >
      <View style={{ paddingTop: SCREEN_SECTION_TOP_SPACING }}>
        <ContentSection
          title={t("home.recentlyPlayed")}
          data={recentlyPlayedPreviewTracks}
          onViewMore={() => router.push("/(main)/(home)/recently-played")}
          emptyState={{
            icon: <LocalClock01SolidIcon fill="none" width={48} height={48} color={muted} />,
            title: t("home.empty.recentlyPlayedTitle"),
            message: t("home.empty.recentlyPlayedMessage"),
          }}
          renderContent={(data) => (
            <MediaCarousel
              data={data}
              renderItem={(item) => (
                <TrackRow
                  track={item}
                  variant="grid"
                  onPress={() =>
                    playTrack(
                      item,
                      recentlyPlayedTracks,
                      createPlaybackQueueContext("trackList", t("home.recentlyPlayed"))
                    )
                  }
                  onLongPress={() => {
                    setSelectedTrack(item)
                    setIsTrackSheetOpen(true)
                  }}
                  titleClassName={currentTrackId === item.id ? "text-accent" : undefined}
                  imageOverlay={currentTrackId === item.id ? <ScaleLoader size={28} /> : undefined}
                />
              )}
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
            icon: <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={muted} />,
            title: t("home.empty.topTracksTitle"),
            message: t("home.empty.topTracksMessage"),
          }}
          renderContent={(data) => (
            <RankedTrackCarousel
              data={data}
              chunkSize={CHUNK_SIZE}
              queueContext={createPlaybackQueueContext("trackList", t("home.topTracks"))}
            />
          )}
        />
      </View>
      <TrackActionSheet
        track={selectedTrack}
        isOpen={isTrackSheetOpen}
        onClose={() => {
          setIsTrackSheetOpen(false)
          setSelectedTrack(null)
        }}
      />
    </ScrollView>
  )
}
