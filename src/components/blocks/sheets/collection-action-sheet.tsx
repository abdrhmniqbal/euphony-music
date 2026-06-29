/**
 * Purpose: Renders shared collection action sheet controls for albums, artists, album artists, folders, genres, and playlists.
 * Caller: Library, search, and collection surfaces that expose context menus.
 * Dependencies: HeroUI bottom sheet, favorites queries/mutations, playback queue helpers, toast runtime, playlist artwork, and theme colors.
 * Main Functions: CollectionActionSheet()
 * Side Effects: Toggles favorites, queues tracks for playback, and shows empty-state toasts.
 */

import { Image } from "expo-image"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import * as React from "react"
import type { FavoriteType } from "@/modules/favorites/types"

import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
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
import { MenuRow } from "@/components/ui/menu-row"
import { ActionSheet } from "@/components/ui/action-sheet"
import LocalNextIcon from "../../icons/local/next"
import LocalAddCircleIcon from "../../icons/local/add-circle"

interface CollectionActionSheetProps {
  visible: boolean
  onOpenChange: (open: boolean) => void
  type: "album" | "artist" | "folder" | "genre" | "playlist" | "mix"
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

  const favoriteType: FavoriteType =
    type === "genre" || type === "folder" || type === "mix" ? "track" : type
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
    <ActionSheet.Root isOpen={visible} onOpenChange={onOpenChange}>
      <ActionSheet.Content className="pb-8">
        <View className="mb-4 mt-2 flex-row items-center gap-3 px-1">
          {type === "playlist" || type === "mix" ? (
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
                  <LocalFavouriteSolidIcon
                    fill="none"
                    width={22}
                    height={22}
                    color={theme.danger}
                  />
                ) : (
                  <LocalFavouriteIcon fill="none" width={22} height={22} color={theme.muted} />
                )
              }
              label={isFavorite ? t("track.removeFromFavorites") : t("track.addToFavorites")}
              onPress={handleToggleFavorite}
            />
          )}
          <MenuRow
            icon={<LocalNextIcon fill="none" width={22} height={22} color={theme.muted} />}
            label={t("track.playNext")}
            onPress={handlePlayNext}
          />
          <MenuRow
            icon={<LocalAddCircleIcon fill="none" width={22} height={22} color={theme.muted} />}
            label={t("track.addToQueue")}
            onPress={handleAddQueue}
          />
          {children}
        </View>
      </ActionSheet.Content>
    </ActionSheet.Root>
  )
}
