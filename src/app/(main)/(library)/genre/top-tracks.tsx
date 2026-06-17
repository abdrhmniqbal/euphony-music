/**
 * Purpose: Renders the Genre Top Tracks detail route.
 * Caller: Genre detail sub-route in the Library stack.
 * Dependencies: genre top-tracks query, track playback service, themed refresh control, theme colors.
 * Main Functions: GenreTopTracksScreen()
 * Side Effects: Starts indexing on refresh, updates scroll state, and starts context-aware playback.
 */

import { useLocalSearchParams } from "expo-router"
import { useMemo } from "react"
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
import { Stack } from "@/layouts/stack"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { scheduleRouteWarning } from "@/modules/navigation/route-warning-runtime"
import { playTrack } from "@/modules/player/service"
import { useGenreTopTracks } from "@/modules/search/queries"
import { useThemeColors } from "@/modules/ui/theme"
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/modules/ui/store"

function getSafeRouteName(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
  try {
    return {
      value: decodeURIComponent(raw),
      raw,
      decodeFailed: false,
    }
  } catch {
    return {
      value: raw,
      raw,
      decodeFailed: true,
    }
  }
}

export default function GenreTopTracksScreen() {
  const { t } = useTranslation()
  const { name } = useLocalSearchParams<{ name: string }>()
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const theme = useThemeColors()

  const parsedGenreRouteName = useMemo(() => getSafeRouteName(name), [name])
  const genreName = parsedGenreRouteName.value
  const normalizedGenreName = genreName.trim()

  scheduleRouteWarning({
    key: "genre-top-tracks:missing-name",
    message: "Genre top-tracks route missing name param",
    metadata: { route: "/genre/top-tracks" },
    enabled: !normalizedGenreName,
  })
  scheduleRouteWarning({
    key: `genre-top-tracks:decode-failed:${parsedGenreRouteName.raw}`,
    message: "Genre top-tracks route name decode failed",
    metadata: {
      route: "/genre/top-tracks",
      rawName: parsedGenreRouteName.raw,
    },
    enabled: parsedGenreRouteName.decodeFailed,
  })

  const { data, isLoading, isFetching, refetch } =
    useGenreTopTracks(normalizedGenreName)
  const tracks = data ?? []

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function playAll() {
    if (tracks.length === 0) {
      return
    }

    playTrack(tracks[0], tracks, {
      type: "genre",
      title: genreName,
    })
  }

  function shuffle() {
    if (tracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks, {
      type: "genre",
      title: genreName,
    })
  }

  function playGenreTrack(track: (typeof tracks)[number]) {
    playTrack(track, tracks, {
      type: "genre",
      title: genreName,
    })
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: `${genreName} ${t("home.topTracks")}`,
        }}
      />
      {tracks.length === 0 ? (
        <Animated.View
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
            message={t("library.genreTopTracksLongMessage", {
              genre: genreName,
            })}
            className="mt-12"
          />
        </Animated.View>
      ) : (
        <TrackList
          data={tracks}
          onTrackPress={playGenreTrack}
          showNumbers
          contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 16 }}
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
            <PlaybackActionsRow
              onPlay={playAll}
              onShuffle={shuffle}
              className="mb-2 px-0 py-0"
            />
          }
        />
      )}
    </View>
  )
}
