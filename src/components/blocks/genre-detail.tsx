import { useLocalSearchParams, Stack } from "expo-router"
import * as React from "react"
import { useMemo } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useThemeColor } from "heroui-native"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { AlbumGrid } from "@/components/blocks/album-grid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { PlaybackActionsRow } from "@/components/blocks/playback-actions-row"
import { TrackList } from "@/components/blocks/track-list"
import { BackButton } from "@/components/patterns/back-button"
import { EmptyState } from "@/components/ui/empty-state"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { getPreferenceState } from "@/core/preferences/store"
import { useGenreDetails } from "@/domains/genres/queries"
import type { GenreAlbum } from "@/domains/genres/queries"
import { toPlayerTrack } from "@/playback/player-track"
import type { PlayerTrack } from "@/playback/types"
import { usePlaybackActions } from "@/domains/library/detail-actions"

const TOP_TRACKS_PREVIEW_LIMIT = 25

export function GenreDetailScreen() {
  const { t } = useTranslation()
  const [showActionSheet, setShowActionSheet] = React.useState(false)
  const { name } = useLocalSearchParams<{ name: string }>()
  const muted = useThemeColor("muted")
  const splitConfig = getPreferenceState().splitMultipleValueConfig

  const genreName = useMemo(() => {
    try {
      return decodeURIComponent(name ?? "").trim()
    } catch {
      return (name ?? "").trim()
    }
  }, [name])

  const { data, isLoading } = useGenreDetails(genreName)

  const topTracks = useMemo(
    () =>
      (data?.topTracks ?? [])
        .slice(0, TOP_TRACKS_PREVIEW_LIMIT)
        .map((row): PlayerTrack | null =>
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

  const { playAll, shuffle } = usePlaybackActions(topTracks, genreName, "genre")

  if (!genreName) {
    return (
      <EmptyState
        icon={<LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={muted} />}
        title={t("library.genre")}
        message={t("home.empty.topTracksTitle")}
      />
    )
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ScaleLoader size={22} />
      </View>
    )
  }

  function toAlbumItems(albums: GenreAlbum[]) {
    return albums.map((album) => ({
      id: album.id ?? album.name,
      title: album.name,
      artist: album.artist ?? t("library.unknownArtist"),
      image: album.image ?? undefined,
      trackCount: album.trackCount,
      year: album.year ?? 0,
      dateAdded: 0,
    }))
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "",
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" />,
        }}
      />
      <TrackList
        data={topTracks}
        showNumbers
        queueContext={{ type: "genre", title: genreName }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
        listHeader={
          <View className="pt-6 pb-4">
            <Text className="text-3xl font-bold text-foreground">{genreName}</Text>
            <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} className="mt-4 mb-2" />
          </View>
        }
        listFooter={
          data && data.albums.length > 0 ? (
            <View className="mt-8 -mx-4">
              <AlbumGrid horizontal data={toAlbumItems(data.albums)} />
            </View>
          ) : null
        }
      />

      <CollectionActionSheet
        visible={showActionSheet}
        onOpenChange={setShowActionSheet}
        type="genre"
        id={genreName}
        name={genreName}
        subtitle={t("library.genre")}
        trackCount={data?.topTracks.length || 0}
        hideFavoriteAction
      />
    </View>
  )
}
