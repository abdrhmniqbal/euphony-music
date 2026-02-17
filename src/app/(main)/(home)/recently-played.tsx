import { useStore } from "@nanostores/react"
import { RefreshControl, ScrollView, View } from "react-native"

import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { useRecentlyPlayedScreen } from "@/modules/history/hooks/use-recently-played-screen"
import { $indexerState } from "@/modules/indexer"
import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import { PlaybackActionsRow } from "@/components/blocks"
import { TrackList } from "@/components/blocks/track-list"
import { EmptyState } from "@/components/ui"

export default function RecentlyPlayedScreen() {
  const theme = useThemeColors()
  const indexerState = useStore($indexerState)
  const { history, refresh, playFirst, shuffle } = useRecentlyPlayedScreen()

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
        onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollStop}
        onScrollEndDrag={handleScrollStop}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={indexerState.isIndexing}
            onRefresh={refresh}
            tintColor={theme.accent}
          />
        }
      >
        {history.length > 0 && (
          <PlaybackActionsRow
            onPlay={playFirst}
            onShuffle={shuffle}
            className="px-4 py-4"
          />
        )}

        <View className="px-4">
          {history.length === 0 ? (
            <EmptyState
              icon={
                <LocalClockSolidIcon
                  fill="none"
                  width={48}
                  height={48}
                  color={theme.muted}
                />
              }
              title="No recently played"
              message="Your listening history will appear here once you start playing music."
              className="mt-12"
            />
          ) : (
            <TrackList data={history} />
          )}
        </View>
      </ScrollView>
    </View>
  )
}
