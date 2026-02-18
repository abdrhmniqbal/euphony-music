import * as React from "react"
import { useState } from "react"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { Button } from "heroui-native"
import {
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated"

import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { useArtistDetailsScreen } from "@/modules/artists/hooks/use-artist-details-screen"
import { useToggleFavorite } from "@/modules/favorites/favorites.queries"
import {
  ALBUM_SORT_OPTIONS,
  TRACK_SORT_OPTIONS,
  type SortField,
} from "@/modules/library/library-sort.store"
import { cn } from "@/utils/common"
import LocalArrowLeftIcon from "@/components/icons/local/arrow-left"
import LocalChevronLeftIcon from "@/components/icons/local/chevron-left"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { PlaybackActionsRow } from "@/components/blocks"
import { AlbumGrid, type Album } from "@/components/blocks/album-grid"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { TrackList } from "@/components/blocks/track-list"
import { TrackRow } from "@/components/patterns"
import { SectionTitle } from "@/components/ui"

const SCREEN_WIDTH = Dimensions.get("window").width
const HEADER_COLLAPSE_THRESHOLD = SCREEN_WIDTH - 120

export default function ArtistDetailsScreen() {
  const theme = useThemeColors()
  const router = useRouter()
  const toggleFavoriteMutation = useToggleFavorite()
  const { from, query } = useLocalSearchParams<{
    from?: string
    query?: string
  }>()
  const [isHeaderSolid, setIsHeaderSolid] = useState(false)
  const {
    name,
    artistTracks,
    artistId,
    artistImage,
    isArtistFavorite,
    albums,
    sortedArtistTracks,
    popularTracks,
    sortedAlbums,
    activeView,
    navDirection,
    sortModalVisible,
    setSortModalVisible,
    sortConfig,
    navigateTo,
    playArtistTrack,
    playAllTracks,
    shuffleTracks,
    openAlbum,
    selectSort,
    getSortLabel,
  } = useArtistDetailsScreen()

  const artistName = name || "Unknown Artist"

  function handleBack() {
    if (from === "search") {
      router.replace({
        pathname: "/search-interaction",
        params: query ? { query } : {},
      })
      return
    }

    router.back()
  }

  function handleSortSelect(field: SortField, order?: "asc" | "desc") {
    selectSort(field, order)
  }

  const renderHeroSection = () => (
    <View style={{ height: SCREEN_WIDTH }} className="relative">
      {artistImage ? (
        <Image
          source={{ uri: artistImage }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <View className="h-full w-full items-center justify-center bg-surface-secondary">
          <LocalUserSolidIcon
            fill="none"
            width={120}
            height={120}
            color={theme.muted}
          />
        </View>
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", theme.background]}
        locations={[0.3, 0.7, 1]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "60%",
        }}
      />

      <View className="absolute right-6 bottom-8 left-6">
        <Text className="mb-2 text-4xl font-bold text-white">{artistName}</Text>
        <Text className="text-base text-white/70">{artistTracks.length} tracks</Text>
      </View>
    </View>
  )

  return (
    <SortSheet
      visible={sortModalVisible}
      onOpenChange={setSortModalVisible}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={handleSortSelect}
    >
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{
            headerTransparent: true,
            headerStyle: {
              backgroundColor: isHeaderSolid ? theme.background : "transparent",
            },
            title: isHeaderSolid ? artistName : "",
            headerTintColor: isHeaderSolid ? theme.foreground : "white",
            headerBackVisible: false,
            headerLeft: () => (
              <Button
                onPress={handleBack}
                variant="ghost"
                className={cn("-ml-2", !isHeaderSolid && "bg-overlay/30")}
                isIconOnly
              >
                <LocalArrowLeftIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={isHeaderSolid ? theme.foreground : "white"}
                />
              </Button>
            ),
            headerRight: () =>
              artistId ? (
                <Button
                  onPress={() => {
                    if (!artistId) {
                      return
                    }

                    void toggleFavoriteMutation.mutateAsync({
                      type: "artist",
                      itemId: artistId,
                      isCurrentlyFavorite: isArtistFavorite,
                      name: artistName,
                      subtitle: `${artistTracks.length} tracks`,
                      image: artistImage,
                    })
                  }}
                  isDisabled={toggleFavoriteMutation.isPending}
                  variant="ghost"
                  className={cn("-ml-2", !isHeaderSolid && "bg-overlay/30")}
                  isIconOnly
                >
                  {isArtistFavorite ? (
                    <LocalFavouriteSolidIcon
                      fill="none"
                      width={24}
                      height={24}
                      color="#ef4444"
                    />
                  ) : (
                    <LocalFavouriteIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={isHeaderSolid ? theme.foreground : "white"}
                    />
                  )}
                </Button>
              ) : undefined,
          }}
        />

        {activeView === "overview" ? (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y
              handleScroll(y)
              const nextHeaderSolid = y > HEADER_COLLAPSE_THRESHOLD
              if (nextHeaderSolid !== isHeaderSolid) {
                setIsHeaderSolid(nextHeaderSolid)
              }
            }}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            scrollEventThrottle={16}
          >
            {renderHeroSection()}

            <Animated.View
              key={activeView}
              entering={
                navDirection === "back"
                  ? SlideInLeft.duration(200)
                  : FadeIn.duration(200)
              }
              className="pt-4"
            >
              <View className="px-6">
                <SectionTitle
                  title="Tracks"
                  onViewMore={() => navigateTo("tracks")}
                />
                <View style={{ gap: 8 }}>
                  {popularTracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      onPress={() => playArtistTrack(track)}
                    />
                  ))}
                </View>
              </View>

              {albums.length > 0 && (
                <View className="mt-8 px-6">
                  <SectionTitle
                    title="Albums"
                    onViewMore={() => navigateTo("albums")}
                  />
                  <AlbumGrid
                    horizontal
                    data={albums.map(
                      (album) => ({ ...album, id: album.title }) as Album
                    )}
                    onAlbumPress={openAlbum}
                  />
                </View>
              )}
            </Animated.View>
          </ScrollView>
        ) : activeView === "tracks" ? (
          <TrackList
            data={sortedArtistTracks}
            onTrackPress={playArtistTrack}
            contentContainerStyle={{ paddingBottom: 200, paddingHorizontal: 24 }}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y
              handleScroll(y)
              const nextHeaderSolid = y > HEADER_COLLAPSE_THRESHOLD
              if (nextHeaderSolid !== isHeaderSolid) {
                setIsHeaderSolid(nextHeaderSolid)
              }
            }}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            listHeader={
              <>
                {renderHeroSection()}
                <Animated.View entering={SlideInRight.duration(200)} className="pt-4">
                  <View className="mb-6 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => navigateTo("overview")}
                        className="mr-2 active:opacity-50"
                      >
                        <LocalChevronLeftIcon
                          fill="none"
                          width={20}
                          height={20}
                          color={theme.muted}
                        />
                      </Pressable>
                      <Text className="text-lg font-bold text-foreground">
                        All Tracks
                      </Text>
                    </View>
                    <SortSheet.Trigger label={getSortLabel()} iconSize={14} />
                  </View>
                  <PlaybackActionsRow
                    onPlay={playAllTracks}
                    onShuffle={shuffleTracks}
                  />
                </Animated.View>
              </>
            }
          />
        ) : (
          <AlbumGrid
            data={sortedAlbums}
            onAlbumPress={openAlbum}
            contentContainerStyle={{
              paddingBottom: 200,
              paddingHorizontal: 16,
            }}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y
              handleScroll(y)
              const nextHeaderSolid = y > HEADER_COLLAPSE_THRESHOLD
              if (nextHeaderSolid !== isHeaderSolid) {
                setIsHeaderSolid(nextHeaderSolid)
              }
            }}
            onScrollBeginDrag={handleScrollStart}
            onMomentumScrollEnd={handleScrollStop}
            onScrollEndDrag={handleScrollStop}
            listHeader={
              <>
                {renderHeroSection()}
                <Animated.View entering={SlideInRight.duration(200)} className="px-2 pt-4">
                  <View className="mb-6 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => navigateTo("overview")}
                        className="mr-2 active:opacity-50"
                      >
                        <LocalChevronLeftIcon
                          fill="none"
                          width={20}
                          height={20}
                          color={theme.muted}
                        />
                      </Pressable>
                      <Text className="text-lg font-bold text-foreground">
                        All Albums
                      </Text>
                    </View>
                    <SortSheet.Trigger label={getSortLabel()} iconSize={14} />
                  </View>
                </Animated.View>
              </>
            }
          />
        )}

        <SortSheet.Content
          options={
            activeView === "tracks"
              ? TRACK_SORT_OPTIONS
              : activeView === "albums"
                ? ALBUM_SORT_OPTIONS
                : []
          }
        />
      </View>
    </SortSheet>
  )
}
