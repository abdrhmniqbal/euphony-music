/**
 * Purpose: Renders shared collection action sheet controls for albums, artists, album artists, folders, genres, and playlists.
 * Caller: Library, search, and collection surfaces that expose context menus.
 * Dependencies: HeroUI bottom sheet, favorites queries/mutations, playback queue helpers, toast runtime, playlist artwork, and theme colors.
 * Main Functions: CollectionActionSheet()
 * Side Effects: Toggles favorites, queues tracks for playback, and shows empty-state toasts.
 */

import { BottomSheet, Button } from "heroui-native"
import { Image } from "expo-image"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import * as React from "react"
import type { FavoriteType } from "@/modules/favorites/types"

import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalNextSolidIcon from "@/components/icons/local/next-solid"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"

import { useIsFavorite } from "@/modules/favorites/queries"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { getTrackIdsList } from "@/stores/playback/utils"
import { Queue } from "@/stores/playback/actions"
import { useThemeColors } from "@/modules/ui/theme"
import { showAppToast } from "@/modules/ui/toast"

interface CollectionActionSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  type: "album" | "artist" | "folder" | "genre" | "playlist"
  id: string
  name: string
  subtitle?: string
  image?: string
  images?: string[]
  trackCount?: number
  favoriteId?: string
  hideFavoriteAction?: boolean
  children?: React.ReactNode
}

interface MenuRowProps {
  icon: React.ReactNode
  label: string
  onPress: () => void
  colorClassName?: string
}

function MenuRow({ icon, label, onPress, colorClassName = "text-foreground" }: MenuRowProps) {
  return (
    <Button variant="ghost" onPress={onPress} className="h-13 w-full justify-start px-0">
      <View className="flex-row items-center gap-4 px-1">
        <View className="w-6 items-center justify-center">{icon}</View>
        <Text className={`text-base font-medium ${colorClassName}`}>{label}</Text>
      </View>
    </Button>
  )
}

export function CollectionActionSheet({
  visible,
  onOpenChange,
  type,
  id,
  name,
  subtitle,
  image,
  images,
  trackCount = 0,
  favoriteId,
  hideFavoriteAction = false,
  children,
}: CollectionActionSheetProps) {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const toggleFavoriteMutation = useToggleFavorite()

  const favoriteType: FavoriteType = type === "genre" || type === "folder" ? "track" : type
  const resolvedFavoriteId = favoriteId || id
  const favoriteItemId = hideFavoriteAction ? "" : resolvedFavoriteId
  const { data: isFavoriteData = false } = useIsFavorite(favoriteType, favoriteItemId)
  const isFavorite = Boolean(isFavoriteData)

  const handleToggleFavorite = async () => {
    onOpenChange(false)
    await toggleFavoriteMutation.mutateAsync({
      type: favoriteType,
      itemId: resolvedFavoriteId,
      isCurrentlyFavorite: isFavorite,
      name,
      subtitle: subtitle || t("library.count.track", { count: trackCount }),
      image,
    })
  }

  const handleAddQueue = async () => {
    onOpenChange(false)
    const trackIds = await getTrackIdsList({ type, id })
    if (trackIds.length > 0) {
      Queue.addToEnd({ id: trackIds, name })
    } else {
      showAppToast(t("library.empty.tracksFoundTitle"))
    }
  }

  const handlePlayNext = async () => {
    onOpenChange(false)
    const trackIds = await getTrackIdsList({ type, id })
    if (trackIds.length > 0) {
      Queue.add({ id: trackIds, name })
    } else {
      showAppToast(t("library.empty.tracksFoundTitle"))
    }
  }

  return (
    <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content backgroundClassName="bg-surface" className="pb-8">
          <View className="mb-4 mt-2 flex-row items-center gap-3 px-1">
            {type === "playlist" ? (
              <View className="h-14 w-14 overflow-hidden rounded-lg bg-surface-secondary">
                <PlaylistArtwork images={resolvePlaylistArtworkImages(images, image)} />
              </View>
            ) : type === "artist" && image ? (
              <View className="h-14 w-14 overflow-hidden rounded-full bg-surface-secondary">
                <Image source={{ uri: image }} style={{ width: "100%", height: "100%" }} />
              </View>
            ) : image ? (
              <View className="h-14 w-14 overflow-hidden rounded-lg bg-surface-secondary">
                <Image source={{ uri: image }} style={{ width: "100%", height: "100%" }} />
              </View>
            ) : null}
            <View className="flex-1">
              <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
                {name}
              </Text>
              {subtitle ? (
                <Text className="mt-1 text-sm text-muted" numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="gap-1">
            {hideFavoriteAction ? null : (
              <MenuRow
                icon={
                  isFavorite ? (
                    <LocalFavouriteSolidIcon fill="none" width={24} height={24} color={theme.danger} />
                  ) : (
                    <LocalFavouriteIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.foreground}
                    />
                  )
                }
                label={isFavorite ? t("track.removeFromFavorites") : t("track.addToFavorites")}
                onPress={handleToggleFavorite}
              />
            )}
            <MenuRow
              icon={
                <LocalNextSolidIcon fill="none" width={24} height={24} color={theme.foreground} />
              }
              label={t("track.playNext")}
              onPress={handlePlayNext}
            />
            <MenuRow
              icon={
                <LocalPlaylistSolidIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.foreground}
                />
              }
              label={t("track.addToQueue")}
              onPress={handleAddQueue}
            />
            {children}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
