import { useEffect } from "react"
import { useStore } from "@nanostores/react"
import { Tabs } from "heroui-native"
import { RefreshControl, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { $indexerState } from "@/modules/indexer"
import {
  TOP_TRACKS_TABS,
  useTopTracksScreen,
  type TopTracksTab,
} from "@/modules/tracks/hooks/use-top-tracks-screen"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { PlaybackActionsRow } from "@/components/blocks"
import { TrackList } from "@/components/blocks/track-list"
import { EmptyState } from "@/components/ui"

export default function TopTracksScreen() {
  const indexerState = useStore($indexerState)
  const theme = useThemeColors()
  const { activeTab, setActiveTab, currentTracks, refresh, playAll, shuffle } =
    useTopTracksScreen()
  const contentOpacity = useSharedValue(1)

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    contentOpacity.value = 0

    contentOpacity.value = withTiming(1, { duration: 220 })
  }, [activeTab, contentOpacity])

  return (
    <View className="flex-1 bg-background">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TopTracksTab)}
        className="gap-1.5 px-4 py-4"
      >
        <Tabs.List className="w-full flex-row px-1">
          <Tabs.Indicator className="bg-surface text-surface-foreground" />
          {TOP_TRACKS_TABS.map((tab) => (
            <Tabs.Trigger key={tab} value={tab} className="flex-1 py-2">
              <Tabs.Label className="text-lg">{tab}</Tabs.Label>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>

      {currentTracks.length === 0 ? (
        <Animated.View className="px-4" style={contentAnimatedStyle}>
          <EmptyState
            icon={
              <LocalMusicNoteSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            }
            title="No top tracks yet"
            message="Play some music to see your most played tracks here!"
            className="mt-12"
          />
        </Animated.View>
      ) : (
        <TrackList
          data={currentTracks}
          showNumbers
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          refreshControl={
            <RefreshControl
              refreshing={indexerState.isIndexing}
              onRefresh={refresh}
              tintColor={theme.accent}
            />
          }
          listHeader={
            <Animated.View style={contentAnimatedStyle}>
              <PlaybackActionsRow
                onPlay={playAll}
                onShuffle={shuffle}
                className="px-0 py-4"
              />
            </Animated.View>
          }
        />
      )}
    </View>
  )
}
