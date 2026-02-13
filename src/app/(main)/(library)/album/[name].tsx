import React, { useState } from "react";
import { View, Text, Image, ScrollView } from "react-native";
import { Stack } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store";
import { SortSheet } from "@/components/blocks/sort-sheet";
import { TrackList } from "@/components/blocks/track-list";
import { PlaybackActionsRow } from "@/components/blocks";
import { toggleFavoriteItem } from "@/modules/favorites/favorites.store";
import { useAlbumDetailsScreen } from "@/modules/albums/hooks/use-album-details-screen";
import {
  TRACK_SORT_OPTIONS,
  type SortField,
} from "@/modules/library/library-sort.store";
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid";
import { Button } from "heroui-native";
import LocalFavouriteIcon from "@/components/icons/local/favourite";
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid";
import { EmptyState } from "@/components/ui";

export default function AlbumDetailsScreen() {
  const theme = useThemeColors();
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const {
    albumInfo,
    albumId,
    isAlbumFavorite,
    tracksByDisc,
    sortedTracks,
    sortConfig,
    totalDurationLabel,
    playSelectedTrack,
    playAllTracks,
    shuffleTracks,
    selectSort,
    getSortLabel,
  } = useAlbumDetailsScreen();

  function handleSortSelect(field: SortField, order?: "asc" | "desc") {
    selectSort(field, order);
  }

  if (!albumInfo) {
    return (
      <EmptyState
        icon={
          <LocalVynilSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        title="No albums found"
        message={`No albums found`}
        className="mt-12"
      />
    );
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
            title: albumInfo.title,
            headerRight: () =>
              albumId && (
                <Button
                  onPress={() => {
                    toggleFavoriteItem(
                      albumId,
                      "album",
                      albumInfo.title,
                      albumInfo.artist,
                      albumInfo.image,
                    );
                  }}
                  variant="ghost"
                  className="-mr-2"
                  isIconOnly
                >
                  {isAlbumFavorite ? (
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
                      color={theme.foreground}
                    />
                  )}
                </Button>
              ),
          }}
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 200 }}
          onScroll={(event) => handleScroll(event.nativeEvent.contentOffset.y)}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollEnd={handleScrollStop}
          onScrollEndDrag={handleScrollStop}
          scrollEventThrottle={16}
        >
          <View className="px-4 pb-6">
            <View className="flex-row gap-4 pt-6">
              <View className="w-36 h-36 rounded-lg overflow-hidden bg-surface-secondary">
                {albumInfo.image ? (
                  <Image
                    source={{ uri: albumInfo.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <LocalVynilSolidIcon
                      fill="none"
                      width={48}
                      height={48}
                      color={theme.muted}
                    />
                  </View>
                )}
              </View>

              <View className="flex-1 justify-center">
                <Text
                  className="text-xl font-bold text-foreground"
                  numberOfLines={1}
                >
                  {albumInfo.artist}
                </Text>
                <Text className="text-sm text-muted mt-2">
                  {albumInfo.year ? `${albumInfo.year}` : ""} ·{" "}
                  {totalDurationLabel}
                </Text>
              </View>
            </View>
          </View>

          <Animated.View entering={FadeIn.duration(300)} className="px-4">
            <PlaybackActionsRow
              onPlay={playAllTracks}
              onShuffle={shuffleTracks}
            />
          </Animated.View>

          <View className="px-4 flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">
              {sortedTracks.length} Tracks
            </Text>
            <SortSheet.Trigger label={getSortLabel()} iconSize={16} />
          </View>

          <View className="px-2">
            {Array.from(tracksByDisc.entries()).map(
              ([discNumber, discTracks]) => (
                <View key={discNumber}>
                  <View className="py-3 px-2 mb-2">
                    <Text className="text-sm font-semibold text-muted uppercase tracking-wide">
                      Disc {discNumber}
                    </Text>
                  </View>
                  <TrackList
                    data={discTracks}
                    showNumbers
                    hideCover
                    hideArtist
                    getNumber={(track, index) => track.trackNumber || index + 1}
                    onTrackPress={playSelectedTrack}
                  />
                </View>
              ),
            )}
          </View>
        </ScrollView>

        <SortSheet.Content options={TRACK_SORT_OPTIONS} />
      </View>
    </SortSheet>
  );
}
