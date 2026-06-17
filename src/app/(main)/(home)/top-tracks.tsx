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

import Animated from "react-native-reanimated"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import {
  screenEnterTransition,
  screenExitTransition,
} from "@/constants/animations"
import { useTopTracksByPeriod } from "@/modules/history/queries"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { playTrack } from "@/modules/player/service"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/store"

const TOP_TRACKS_TABS = ["Realtime", "Daily", "Weekly"] as const
type TopTracksTab = (typeof TOP_TRACKS_TABS)[number]
const TOP_TRACKS_LIMIT = 50

function tabToPeriod(tab: TopTracksTab): TopTracksPeriod {
  if (tab === "Daily") {
    return "day"
  }

  if (tab === "Weekly") {
    return "week"
  }

  return "all"
}

export default function TopTracksScreen() {
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const theme = useThemeColors()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TopTracksTab>("Realtime")
  const period = tabToPeriod(activeTab)
  const { data: currentTracksData, isLoading, isFetching, refetch } =
    useTopTracksByPeriod(period, TOP_TRACKS_LIMIT)

  const currentTracks = currentTracksData ?? []

  function getTopTracksTabLabel(tab: TopTracksTab) {
    switch (tab) {
      case "Daily":
        return t("home.tabs.daily")
      case "Weekly":
        return t("home.tabs.weekly")
      case "Realtime":
        return t("home.tabs.realtime")
    }
  }

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

  return (
    <View className="flex-1 bg-background">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TopTracksTab)}
        className="gap-3 px-4 pt-4 pb-3"
      >
        <Tabs.List className="w-full flex-row rounded-[26px] border border-border/60 bg-default/35 px-1 py-1">
          <Tabs.Indicator className="rounded-full bg-background text-surface-foreground" />
          {TOP_TRACKS_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="flex-1 rounded-full py-2.5"
            >
              <Tabs.Label className="text-[15px] font-semibold">
                {getTopTracksTabLabel(tab)}
              </Tabs.Label>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>

      {currentTracks.length === 0 ? (
        <Animated.View
          key={`empty-${activeTab}`}
          entering={screenEnterTransition()}
          exiting={screenExitTransition()}
          className="px-4"
        >
          <EmptyState
            icon={
              <LocalMusicNoteSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            }
            title={t("home.empty.topTracksYetTitle")}
            message={t("home.empty.topTracksYetMessage")}
            className="mt-12"
          />
        </Animated.View>
      ) : (
        <Animated.View
          key={`tracks-${activeTab}`}
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
            onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            refreshControl={
              <ThemedRefreshControl
                refreshing={isIndexing || isLoading || isFetching}
                onRefresh={refresh}
              />
            }
            listHeader={
              <Animated.View
                key={`actions-${activeTab}`}
                entering={screenEnterTransition()}
              >
                <PlaybackActionsRow
                  onPlay={playAll}
                  onShuffle={shuffle}
                  className="mb-2 px-0 py-0"
                />
              </Animated.View>
            }
          />
        </Animated.View>
      )}
    </View>
  )
}
