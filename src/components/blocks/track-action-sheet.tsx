import * as React from "react"
import { useState } from "react"
import { Image } from "expo-image"
import { BottomSheet, Button } from "heroui-native"
import { Text, View } from "react-native"

import { ICON_SIZES } from "@/constants/icon-sizes"
import { useThemeColors } from "@/hooks/use-theme-colors"
import {
  useIsFavorite,
  useToggleFavorite,
} from "@/modules/favorites/favorites.queries"
import { playTrack, type Track } from "@/modules/player/player.store"
import { addToQueue, playNext } from "@/modules/player/queue.store"
import LocalAddIcon from "@/components/icons/local/add"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalNextSolidIcon from "@/components/icons/local/next-solid"
import LocalPlaySolidIcon from "@/components/icons/local/play-solid"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"

interface TrackActionSheetProps {
  track: Track | null
  isOpen: boolean
  onClose: () => void
  tracks?: Track[]
  onAddToPlaylist?: (track: Track) => void
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
  track,
  isOpen,
  onClose,
  tracks,
  onAddToPlaylist,
}) => {
  const theme = useThemeColors()
  const toggleFavoriteMutation = useToggleFavorite()
  const [favoriteOverrides, setFavoriteOverrides] = useState<
    Record<string, boolean>
  >({})
  const favoriteTrackId = track?.id || ""
  const { data: isFavoriteData = track?.isFavorite ?? false } = useIsFavorite(
    "track",
    favoriteTrackId
  )
  const isFavorite = track
    ? (favoriteOverrides[track.id] ?? Boolean(isFavoriteData))
    : false

  const handlePlay = async () => {
    if (track) {
      playTrack(track, tracks)
      onClose()
    }
  }

  const handleToggleFavorite = () => {
    if (track) {
      const newState = !isFavorite
      setFavoriteOverrides((prev) => ({ ...prev, [track.id]: newState }))
      void toggleFavoriteMutation.mutateAsync({
        type: "track",
        itemId: track.id,
        isCurrentlyFavorite: isFavorite,
        name: track.title,
        subtitle: track.artist,
        image: track.image,
      })
    }
  }

  const handlePlayNext = async () => {
    if (track) {
      await playNext(track)
      onClose()
    }
  }

  const handleAddToQueue = async () => {
    if (track) {
      await addToQueue(track)
      onClose()
    }
  }

  const handleAddToPlaylist = () => {
    if (track && onAddToPlaylist) {
      onAddToPlaylist(track)
      onClose()
    }
  }

  if (!track) return null

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content className="rounded-t-3xl border-none px-6 pt-2 pb-8">
          <View className="mb-6 flex-row items-center gap-4">
            <View className="h-20 w-20 overflow-hidden rounded-xl bg-surface">
              {track.image ? (
                <Image
                  source={{ uri: track.image }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <LocalMusicNoteSolidIcon
                    fill="none"
                    width={ICON_SIZES.sheetArtworkFallback}
                    height={ICON_SIZES.sheetArtworkFallback}
                    color={theme.muted}
                  />
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xl leading-tight font-bold text-foreground">
                {track.title}
              </Text>
            </View>
          </View>

          <View className="mb-3 flex-row gap-3">
            <Button
              variant="primary"
              onPress={handlePlay}
              className="h-14 flex-[2] rounded-xl"
            >
              <View className="flex-row items-center gap-2">
                <LocalPlaySolidIcon
                  fill="none"
                  width={24}
                  height={24}
                  color="white"
                />
                <Text className="text-lg font-bold text-white">Play</Text>
              </View>
            </Button>
            <Button
              variant="ghost"
              onPress={handleToggleFavorite}
              className="h-14 flex-1 rounded-xl"
            >
              {isFavorite ? (
                <LocalFavouriteSolidIcon
                  fill="none"
                  width={28}
                  height={28}
                  color="#ef4444"
                />
              ) : (
                <LocalFavouriteIcon
                  fill="none"
                  width={28}
                  height={28}
                  color={theme.foreground}
                />
              )}
            </Button>
          </View>

          <View className="mb-3 flex-row gap-3">
            <Button
              variant="secondary"
              onPress={handleAddToQueue}
              className="h-12 flex-1 rounded-xl"
            >
              <View className="flex-row items-center gap-2">
                <LocalAddIcon
                  fill="none"
                  width={20}
                  height={20}
                  color={theme.foreground}
                />
                <Text className="font-semibold text-foreground">
                  Add to Queue
                </Text>
              </View>
            </Button>
            <Button
              variant="secondary"
              onPress={handlePlayNext}
              className="h-12 flex-1 rounded-xl"
            >
              <View className="flex-row items-center gap-2">
                <LocalNextSolidIcon
                  fill="none"
                  width={20}
                  height={20}
                  color={theme.foreground}
                />
                <Text className="font-semibold text-foreground">Play Next</Text>
              </View>
            </Button>
          </View>

          {onAddToPlaylist && (
            <Button
              variant="ghost"
              onPress={handleAddToPlaylist}
              className="mb-2 h-12 w-full rounded-xl"
            >
              <View className="flex-row items-center gap-2">
                <LocalPlaylistSolidIcon
                  fill="none"
                  width={20}
                  height={20}
                  color={theme.foreground}
                />
                <Text className="font-semibold text-foreground">
                  Add to Playlist
                </Text>
              </View>
            </Button>
          )}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}

export default TrackActionSheet
