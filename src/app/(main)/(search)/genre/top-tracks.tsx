import { useStore } from "@nanostores/react"
import { Stack, useLocalSearchParams } from "expo-router"
import { RefreshControl, View } from "react-native"
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated"

import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { useGenreTopTracksScreen } from "@/modules/genres/hooks/use-genre-top-tracks-screen"
import { $indexerState } from "@/modules/indexer"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { PlaybackActionsRow } from "@/components/blocks"
import { TrackList } from "@/components/blocks/track-list"
import { EmptyState } from "@/components/ui"

export default function GenreTopTracksScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const indexerState = useStore($indexerState)
  const theme = useThemeColors()

  const genreName = decodeURIComponent(name || "")
  const { tracks, isLoading, refresh, playAll, shuffle } =
    useGenreTopTracksScreen(genreName)

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: `${genreName} Top Tracks`,
        }}
      />
      {tracks.length === 0 ? (
        <Animated.View
          entering={FadeInRight.duration(300)}
          exiting={FadeOutLeft.duration(300)}
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
            title="No top tracks yet"
            message={`Play some ${genreName} music to see your most played tracks here!`}
            className="mt-12"
          />
        </Animated.View>
      ) : (
        <TrackList
          data={tracks}
          showNumbers
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
          onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          refreshControl={
            <RefreshControl
              refreshing={indexerState.isIndexing || isLoading}
              onRefresh={refresh}
              tintColor={theme.accent}
            />
          }
          listHeader={
            <PlaybackActionsRow
              onPlay={playAll}
              onShuffle={shuffle}
              className="px-0 py-4"
            />
          }
        />
      )}
    </View>
  )
}
