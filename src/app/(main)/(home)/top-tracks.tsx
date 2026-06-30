/**
 * Purpose: Renders the Top Tracks route with time-range tabs and playback actions.
 * Caller: Home stack nested route.
 * Dependencies: top tracks query, react-i18next, track playback service, themed refresh control, theme colors.
 * Main Functions: TopTracksScreen()
 * Side Effects: Starts indexing on refresh, updates scroll state, and starts context-aware playback.
 */

import type { HistoryTopTracksPeriod as TopTracksPeriod } from "@/modules/history/types"
import { Tabs } from "heroui-native"
import { useState } from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { cn } from "tailwind-variants"

import Animated from "react-native-reanimated"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { screenEnterTransition, screenExitTransition } from "@/constants/animations"
import { useTopTracksByPeriod } from "@/modules/history/queries"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { playTrack } from "@/modules/player/service"
import { useThemeColors } from "@/modules/ui/theme"
import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"

const TOP_TRACKS_LIMIT = 50

export default function TopTracksScreen() {
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const theme = useThemeColors()
  const { t } = useTranslation()
  const [period, setPeriod] = useState<TopTracksPeriod>("all")
  const {
    data: currentTracksData,
    isLoading,
    refetch,
    dataUpdatedAt,
  } = useTopTracksByPeriod(period, TOP_TRACKS_LIMIT)

  const currentTracks = currentTracksData ?? []

  const formattedUpdatedTime =
    dataUpdatedAt > 0
      ? new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
          minute: "numeric",
        }).format(new Date(dataUpdatedAt))
      : null

  const lastUpdatedText = formattedUpdatedTime
    ? t("home.topTracks.lastUpdated", {
        time: formattedUpdatedTime,
        defaultValue: `Charts updated at ${formattedUpdatedTime}`,
      })
    : null

  function getPeriodLabel(p: TopTracksPeriod) {
    switch (p) {
      case "day":
        return t("home.topTracks.today", "Today")
      case "week":
        return t("home.topTracks.thisWeek", "This week")
      case "month":
        return t("home.topTracks.thisMonth", "This month")
      case "all":
        return t("home.topTracks.allTime", "All time")
    }
  }

  const periodOptions: TopTracksPeriod[] = ["all", "day", "week", "month"]

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function playAll() {
    if (currentTracks.length === 0) {
      return
    }

    playTrack(currentTracks[0], currentTracks, {
      type: "trackList",
      title: t("home.topTracks"),
    })
  }

  function shuffle() {
    if (currentTracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * currentTracks.length)
    playTrack(currentTracks[randomIndex], currentTracks, {
      type: "trackList",
      title: t("home.topTracks"),
    })
  }

  function playTopTrack(track: (typeof currentTracks)[number]) {
    playTrack(track, currentTracks, {
      type: "trackList",
      title: t("home.topTracks"),
    })
  }

  const autoHideScrollProps = useAutoHideHeaderScroll()

  return (
    <View className="flex-1 bg-background">
      {currentTracks.length === 0 ? (
        <Animated.View
          key={`empty-${period}`}
          entering={screenEnterTransition()}
          exiting={screenExitTransition()}
          className="px-4"
        >
          <EmptyState
            icon={
              <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
            }
            title={t("home.empty.topTracksYetTitle")}
            message={t("home.empty.topTracksYetMessage")}
            className="mt-12"
          />
        </Animated.View>
      ) : (
        <Animated.View
          key={`tracks-${period}`}
          entering={screenEnterTransition()}
          exiting={screenExitTransition()}
          className="flex-1"
        >
          <TrackList
            data={currentTracks}
            onTrackPress={playTopTrack}
            showNumbers
            contentContainerStyle={{
              paddingBottom: 200,
              paddingHorizontal: 16,
            }}
            {...autoHideScrollProps}
            refreshControl={
              <ThemedRefreshControl
                refreshing={isIndexing || isLoading}
                onRefresh={refresh}
              />
            }
            listHeader={
              <Animated.View key={`actions-${period}`} entering={screenEnterTransition()}>
                <Tabs
                  value={period}
                  onValueChange={(value) => setPeriod(value as TopTracksPeriod)}
                  className="mb-4"
                >
                  <Tabs.List className="bg-surface">
                    <Tabs.ScrollView
                      scrollAlign="start"
                      showsHorizontalScrollIndicator={false}
                      contentContainerClassName="gap-5"
                    >
                      <Tabs.Indicator className="bg-surface-tertiary" />
                      {periodOptions.map((opt) => (
                        <Tabs.Trigger key={opt} value={opt}>
                          {({ isSelected }) => (
                            <Tabs.Label
                              className={cn(
                                "text-xl font-bold px-4 py-2",
                                isSelected ? "text-foreground" : "text-muted"
                              )}
                            >
                              {getPeriodLabel(opt)}
                            </Tabs.Label>
                          )}
                        </Tabs.Trigger>
                      ))}
                    </Tabs.ScrollView>
                  </Tabs.List>
                </Tabs>

                <PlaybackActionsRow
                  onPlay={playAll}
                  onShuffle={shuffle}
                  className="mb-1 px-0 py-0"
                />
                {lastUpdatedText ? (
                  <Animated.Text
                    key={`updated-${period}-${dataUpdatedAt}`}
                    entering={screenEnterTransition()}
                    className="text-left text-xs text-muted my-2"
                  >
                    {lastUpdatedText}
                  </Animated.Text>
                ) : null}
              </Animated.View>
            }
          />
        </Animated.View>
      )}
    </View>
  )
}
