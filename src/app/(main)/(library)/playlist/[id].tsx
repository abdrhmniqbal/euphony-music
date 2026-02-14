import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button } from "heroui-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import {
  handleScroll,
  handleScrollStart,
  handleScrollStop,
} from "@/hooks/scroll-bars.store";
import { TrackList } from "@/components/blocks/track-list";
import {
  DeletePlaylistDialog,
  PlaybackActionsRow,
  PlaylistActionsSheet,
} from "@/components/blocks";
import { PlaylistArtwork } from "@/components/patterns";
import { EmptyState } from "@/components/ui";
import LocalFavouriteIcon from "@/components/icons/local/favourite";
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid";
import { formatDuration } from "@/modules/playlist/playlist.utils";
import { usePlaylistDetailsScreen } from "@/modules/playlist/hooks/use-playlist-details-screen";
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid";
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid";

const HEADER_COLLAPSE_THRESHOLD = 120;

export default function PlaylistDetailsScreen() {
  const router = useRouter();
  const theme = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    playlist,
    tracks,
    playlistImages,
    totalDuration,
    isLoading,
    isFavorite,
    playFromPlaylist,
    playAll,
    shuffle,
    toggleFavorite,
    deletePlaylist,
    isDeleting,
  } = usePlaylistDetailsScreen(id || "");

  async function handleDeleteConfirm() {
    const didDelete = await deletePlaylist();
    if (didDelete) {
      setShowDeleteDialog(false);
      router.replace("/(main)/(library)");
    }
  }

  if (isLoading) {
    return <View className="flex-1 bg-background" />;
  }

  if (!playlist) {
    return (
      <EmptyState
        icon={
          <LocalPlaylistSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        title="Playlist not found"
        message="This playlist may have been removed."
        className="mt-12"
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: showHeaderTitle ? playlist.name : "",
          headerRight: () => (
            <View className="flex-row gap-4 -mr-2">
              <Button
                onPress={toggleFavorite}
                variant="ghost"
                className="-mr-2"
                isIconOnly
              >
                {isFavorite ? (
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
              <Button
                variant="ghost"
                isIconOnly
                onPress={() => setShowActionSheet(true)}
              >
                <LocalMoreHorizontalCircleSolidIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.foreground}
                />
              </Button>
            </View>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          handleScroll(y);
          const nextShowHeaderTitle = y > HEADER_COLLAPSE_THRESHOLD;
          if (nextShowHeaderTitle !== showHeaderTitle) {
            setShowHeaderTitle(nextShowHeaderTitle);
          }
        }}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollStop}
        onScrollEndDrag={handleScrollStop}
        scrollEventThrottle={16}
      >
        <View className="px-4 pb-6">
          <View className="flex-row gap-4 pt-6">
            <View className="w-36 h-36 rounded-lg overflow-hidden bg-surface-secondary">
              <PlaylistArtwork
                images={playlistImages}
                fallback={
                  <LocalPlaylistSolidIcon
                    fill="none"
                    width={48}
                    height={48}
                    color={theme.muted}
                  />
                }
                className="bg-surface-secondary"
              />
            </View>

            <View className="flex-1 justify-center">
              <Text
                className="text-xl font-bold text-foreground"
                numberOfLines={2}
              >
                {playlist.name}
              </Text>
              {playlist.description ? (
                <Text className="text-base text-muted mt-1" numberOfLines={2}>
                  {playlist.description}
                </Text>
              ) : null}
              <Text className="text-sm text-muted mt-2">
                {tracks.length} tracks · {formatDuration(totalDuration)}
              </Text>
            </View>
          </View>
        </View>

        <Animated.View entering={FadeIn.duration(300)} className="px-4">
          <PlaybackActionsRow onPlay={playAll} onShuffle={shuffle} />
        </Animated.View>

        <View className="px-2">
          <TrackList
            data={tracks}
            showNumbers={false}
            hideCover={false}
            hideArtist={false}
            onTrackPress={(track) => playFromPlaylist(track.id)}
          />
        </View>
      </ScrollView>

      <PlaylistActionsSheet
        visible={showActionSheet}
        onOpenChange={setShowActionSheet}
        onEdit={() =>
          router.push({
            pathname: "/(main)/(library)/playlist/form",
            params: { id: playlist.id },
          })
        }
        onDelete={() => setShowDeleteDialog(true)}
      />
      <DeletePlaylistDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </View>
  );
}
