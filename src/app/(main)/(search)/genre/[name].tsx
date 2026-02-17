import { useStore } from "@nanostores/react"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { RefreshControl, ScrollView, View } from "react-native"

import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import type { GenreAlbumInfo } from "@/modules/genres/genres.api"
import { useGenreDetailsScreen } from "@/modules/genres/hooks/use-genre-details-screen"
import { $indexerState } from "@/modules/indexer"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import {
  ContentSection,
  MediaCarousel,
  RankedTrackCarousel,
} from "@/components/blocks"
import { MusicCard } from "@/components/patterns"

const CHUNK_SIZE = 5

export default function GenreDetailsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const router = useRouter()
  const theme = useThemeColors()
  const indexerState = useStore($indexerState)

  const genreName = decodeURIComponent(name || "")
  const { topTracks, previewAlbums, isLoading, refresh } =
    useGenreDetailsScreen(genreName)

  function renderAlbumItem(album: GenreAlbumInfo) {
    const subtitle = `${album.artist || "Unknown Artist"} · ${album.trackCount} tracks`

    return (
      <MusicCard
        title={album.name}
        subtitle={subtitle}
        image={album.image}
        icon={
          <LocalMusicNoteSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        onPress={() =>
          router.push(
            `/(main)/(library)/album/${encodeURIComponent(album.name)}`
          )
        }
      />
    )
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: genreName,
        }}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 200,
        }}
        onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollStop}
        onScrollEndDrag={handleScrollStop}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={indexerState.isIndexing || isLoading}
            onRefresh={refresh}
            tintColor={theme.accent}
          />
        }
      >
        <ContentSection
          title="Top Tracks"
          data={topTracks}
          onViewMore={() =>
            router.push(`./top-tracks?name=${encodeURIComponent(genreName)}`)
          }
          emptyState={{
            icon: (
              <LocalMusicNoteSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            ),
            title: "No top tracks",
            message: `Play some ${genreName} music to see top tracks!`,
          }}
          renderContent={(data) => (
            <RankedTrackCarousel data={data} chunkSize={CHUNK_SIZE} />
          )}
        />

        <ContentSection
          title="Recommended Albums"
          data={previewAlbums}
          onViewMore={() =>
            router.push(`./albums?name=${encodeURIComponent(genreName)}`)
          }
          emptyState={{
            icon: (
              <LocalVynilSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            ),
            title: "No albums found",
            message: `No albums available in ${genreName}`,
          }}
          renderContent={(data) => (
            <MediaCarousel
              data={data}
              renderItem={renderAlbumItem}
              keyExtractor={(album, index) => `${album.name}-${index}`}
            />
          )}
        />
      </ScrollView>
    </View>
  )
}
