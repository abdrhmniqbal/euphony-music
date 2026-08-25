import { useLocalSearchParams, Stack } from "expo-router"
import * as React from "react"
import { useMemo, useState } from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { useThemeColor } from "heroui-native"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import { EmptyState } from "@/components/ui/empty-state"
import { ThemedRefreshControl } from "@/components/ui/themed-refresh-control"
import { getPreferenceState } from "@/core/preferences/store"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { startIndexing } from "@/domains/indexer/service"
import { refreshIndexedMediaState } from "@/domains/indexer/utils/refresh"
import { useGenreDetails } from "@/domains/genres/queries"
import { usePlaybackActions } from "@/domains/library/detail-actions"
import { useCurrentTrackId } from "@/playback/selectors"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"

export function GenreTopTracksScreen() {
  const { t } = useTranslation()
  const { name } = useLocalSearchParams<{ name: string }>()
  const muted = useThemeColor("muted")
  const currentTrackId = useCurrentTrackId()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const genreName = React.useMemo(() => {
    try {
      return decodeURIComponent(name ?? "").trim()
    } catch {
      return (name ?? "").trim()
    }
  }, [name])

  const { data, isLoading, isFetching, refetch } = useGenreDetails(genreName)

  const tracks = useMemo(
    () =>
      (data?.topTracks ?? []).map((row): PlayerTrack | null =>
        toPlayerTrack(
          {
            id: row.id,
            name: row.title,
            artists: row.artistName ? [row.artistName] : null,
            artwork: row.artwork,
            albumId: row.albumId,
            uri: "",
            duration: row.duration,
            discoverTime: row.dateAdded,
            modificationTime: null,
            rawArtistName: row.rawArtist,
            albumName: row.albumTitle,
            artistName: row.artistName,
          },
          splitConfig
        )
      )
      .filter((track): track is PlayerTrack => track !== null),
    [data?.topTracks, splitConfig]
  )

  const { playAll, shuffle } = usePlaybackActions(tracks, genreName, "genre")
  const autoHideScrollProps = useAutoHideHeaderScroll()

  async function refresh() {
    try {
      setIsRefreshing(true)
      await startIndexing(false, false)
      await refreshIndexedMediaState()
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: `${genreName} ${t("home.topTracks")}` }} />
      {tracks.length === 0 ? (
        <EmptyState
          icon={<LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={muted} />}
          title={t("home.empty.topTracksTitle")}
          message={t("library.genreTopTracksLongMessage", { genre: genreName })}
          className="mt-12 px-4"
        />
      ) : (
        <TrackList
          data={tracks}
          showNumbers
          queueContext={{ type: "genre", title: genreName }}
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
            <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} className="mb-2 px-0 py-0" />
          }
        />
      )}
    </View>
  )
}
