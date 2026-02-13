import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import Animated, {
  FadeIn,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "heroui-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store";
import { SectionTitle } from "@/components/ui";
import { TrackList } from "@/components/blocks/track-list";
import { AlbumGrid, type Album } from "@/components/blocks/album-grid";
import { PlaybackActionsRow } from "@/components/blocks";
import { SortSheet } from "@/components/blocks/sort-sheet";
import LocalArrowLeftIcon from "@/components/icons/local/arrow-left";
import LocalFavouriteIcon from "@/components/icons/local/favourite";
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid";
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid";
import { toggleFavoriteItem } from "@/modules/favorites/favorites.store";
import { useArtistDetailsScreen } from "@/modules/artists/hooks/use-artist-details-screen";
import {
  TRACK_SORT_OPTIONS,
  ALBUM_SORT_OPTIONS,
  type SortField,
} from "@/modules/library/library-sort.store";
import { cn } from "@/utils/common";
import LocalChevronLeftIcon from "@/components/icons/local/chevron-left";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HEADER_COLLAPSE_THRESHOLD = SCREEN_WIDTH - 120;

export default function ArtistDetailsScreen() {
  const theme = useThemeColors();
  const router = useRouter();
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
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
  } = useArtistDetailsScreen();

  const artistName = name || "Unknown Artist";

  function handleSortSelect(field: SortField, order?: "asc" | "desc") {
    selectSort(field, order);
  }

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
                onPress={() => router.back()}
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
                    toggleFavoriteItem(
                      artistId,
                      "artist",
                      artistName,
                      `${artistTracks.length} tracks`,
                      artistImage,
                    );
                  }}
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

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 200 }}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            handleScroll(y);
            const nextHeaderSolid = y > HEADER_COLLAPSE_THRESHOLD;
            if (nextHeaderSolid !== isHeaderSolid) {
              setIsHeaderSolid(nextHeaderSolid);
            }
          }}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          scrollEventThrottle={16}
        >
          <View style={{ height: SCREEN_WIDTH }} className="relative">
            {artistImage ? (
              <Image
                source={{ uri: artistImage }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-surface-secondary items-center justify-center">
                <LocalMusicNoteSolidIcon
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

            <View className="absolute bottom-8 left-6 right-6">
              <Text className="text-4xl font-bold text-white mb-2">
                {artistName}
              </Text>
              <Text className="text-base text-white/70">
                {artistTracks.length} tracks
              </Text>
            </View>
          </View>

          <Animated.View
            key={activeView}
            entering={
              activeView === "overview"
                ? navDirection === "back"
                  ? SlideInLeft.duration(200)
                  : FadeIn.duration(200)
                : SlideInRight.duration(200)
            }
            className={activeView === "overview" ? "pt-4" : "px-6 pt-4"}
          >
            {activeView === "overview" ? (
              <>
                <View className="px-6">
                  <SectionTitle
                    title="Tracks"
                    onViewMore={() => navigateTo("tracks")}
                  />
                  <TrackList
                    data={popularTracks}
                    onTrackPress={playArtistTrack}
                  />
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
                        (album) => ({ ...album, id: album.title }) as Album,
                      )}
                      onAlbumPress={openAlbum}
                    />
                  </View>
                )}
              </>
            ) : activeView === "tracks" ? (
              <>
                <View className="flex-row items-center justify-between mb-6">
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

                <TrackList data={sortedArtistTracks} />
              </>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-6">
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

                <AlbumGrid
                  data={sortedAlbums}
                  onAlbumPress={openAlbum}
                  scrollEnabled={false}
                />
              </>
            )}
          </Animated.View>
        </ScrollView>

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
  );
}
