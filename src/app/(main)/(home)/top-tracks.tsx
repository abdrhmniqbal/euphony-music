import { Tabs } from "heroui-native"
import { useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { cn } from "tailwind-variants"

import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated"

import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { BackButton } from "@/components/patterns/back-button"
import { useTopTracksByPeriod, type HistoryTopTracksPeriod } from "@/domains/history/repository"
import { startIndexing } from "@/domains/indexer/service"
import { playTrack } from "@/playback/service"
import { createPlaybackQueueContext, type PlayerTrack } from "@/playback/types"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"

const TOP_TRACKS_LIMIT = 50
const PERIOD_OPTIONS: HistoryTopTracksPeriod[] = ["all", "day", "week", "month"]

export default function TopTracksScreen() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<HistoryTopTracksPeriod>("all")
  const {
    data: currentTracksData,
    isLoading,
    refetch,
  } = useTopTracksByPeriod(period, TOP_TRACKS_LIMIT)

  const currentTracks = (currentTracksData ?? []).filter((track) => track.uri !== "")

  function getPeriodLabel(value: HistoryTopTracksPeriod) {
    switch (value) {
      case "day":
        return t("home.topTracksToday")
      case "week":
        return t("home.topTracksThisWeek")
      case "month":
        return t("home.topTracksThisMonth")
      case "all":
        return t("home.topTracksAllTime")
    }
  }

  async function refresh() {
    await startIndexing(false, false)
    await refetch()
  }

  const queueContext = createPlaybackQueueContext("trackList", t("home.topTracks"))

  function playAll() {
    if (currentTracks.length > 0) {
      playTrack(currentTracks[0], currentTracks, queueContext)
    }
  }

  function shuffle() {
    if (currentTracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * currentTracks.length)
    playTrack(currentTracks[randomIndex], currentTracks, queueContext)
  }

  function playTopTrack(track: PlayerTrack) {
    playTrack(track, currentTracks, queueContext)
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

  return (
    <View className="flex-1 bg-background pt-16">
      <View className="flex-row items-center px-4 pb-3">
        <BackButton className="-ml-2" fallbackHref="/(main)/(home)" />
        <Text className="ml-2 flex-1 text-xl font-bold text-foreground" numberOfLines={1}>
          {t("home.topTracks")}
        </Text>
      </View>
      <Animated.View key={`content-${period}`} entering={FadeIn} exiting={FadeOut} className="flex-1">
        {currentTracks.length === 0 ? (
          <View className="px-4">
            <EmptyState
              icon={
                <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color="#9ca3af" />
              }
              title={t("home.empty.topTracksTitle")}
              message={t("home.empty.topTracksMessage")}
              className="mt-12"
            />
          </View>
        ) : (
          <TrackList
            data={currentTracks}
            onTrackPress={playTopTrack}
            showNumbers
            contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
            {...autoHideScrollProps}
            refreshControl={
              <ThemedRefreshControl refreshing={isLoading} onRefresh={() => void refresh()} />
            }
            listHeader={
              <View>
                <Tabs
                  value={period}
                  // SAFETY: the only rendered triggers are PERIOD_OPTIONS entries, so emitted values are always valid periods
                  onValueChange={(value) => setPeriod(value as HistoryTopTracksPeriod)}
                  className="mb-4"
                >
                  <Tabs.List className="bg-surface">
                    <Tabs.ScrollView
                      scrollAlign="start"
                      showsHorizontalScrollIndicator={false}
                      contentContainerClassName="gap-5"
                    >
                      <Tabs.Indicator className="bg-surface-tertiary" />
                      {PERIOD_OPTIONS.map((option) => (
                        <Tabs.Trigger key={option} value={option}>
                          {({ isSelected }) => (
                            <Tabs.Label
                              className={cn(
                                "px-4 py-2 text-xl font-bold",
                                isSelected ? "text-foreground" : "text-muted"
                              )}
                            >
                              {getPeriodLabel(option)}
                            </Tabs.Label>
                          )}
                        </Tabs.Trigger>
                      ))}
                    </Tabs.ScrollView>
                  </Tabs.List>
                </Tabs>
                <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} className="mb-2 px-0 py-0" />
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  )
}
