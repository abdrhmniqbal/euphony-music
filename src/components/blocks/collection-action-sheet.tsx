import { Image } from "expo-image"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import * as React from "react"
import { useThemeColor } from "heroui-native"
import { cn } from "tailwind-variants"

import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalFolder01SolidIcon from "@/components/icons/local/folder-01-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalNextIcon from "@/components/icons/local/next"
import LocalAddCircleIcon from "@/components/icons/local/add-circle"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { ActionSheet } from "@/components/ui/action-sheet"
import { MenuRow } from "@/components/ui/menu-row"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import { useIsFavorite } from "@/domains/favorites/queries"
import { useToggleFavorite } from "@/domains/favorites/mutations"
import type { FavoriteType } from "@/domains/favorites/types"
import { getQueueSourceTrackIds } from "@/domains/library/queue-sources"
import { addCollectionToQueue, queueCollectionNext } from "@/playback/queue-actions"
import { showAppToast } from "@/core/ui/toast"

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
  images: _images,
  trackCount = 0,
  favoriteId,
  hideFavoriteAction = false,
  children,
}: CollectionActionSheetProps) {
  const { t } = useTranslation()
  const [danger, muted] = useThemeColor(["danger", "muted"])
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
    const trackIds = await getQueueSourceTrackIds({ type, id })
    if (trackIds.length > 0) {
      addCollectionToQueue(trackIds, name)
    } else {
      showAppToast(t("library.empty.tracksFoundTitle"))
    }
  }

  const handlePlayNext = async () => {
    onOpenChange(false)
    const trackIds = await getQueueSourceTrackIds({ type, id })
    if (trackIds.length > 0) {
      queueCollectionNext(trackIds, name)
    } else {
      showAppToast(t("library.empty.tracksFoundTitle"))
    }
  }

  const renderArtworkHeader = () => {
    if (type === "genre") {
      return null
    }

    const isMultiArtworkType = type === "playlist" || type === "mix"

    if (isMultiArtworkType) {
      return (
        <View className="h-18 w-18 overflow-hidden rounded-xl bg-surface-secondary">
          <PlaylistArtwork images={resolvePlaylistArtworkImages(_images, image)} />
        </View>
      )
    }

    if (image) {
      return (
        <View
          className={cn(
            "h-18 w-18 overflow-hidden bg-surface-secondary",
            type === "artist" ? "rounded-full" : "rounded-xl"
          )}
        >
          <Image
            source={{ uri: image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        </View>
      )
    }

    return (
      <View
        className={cn(
          "h-18 w-18 items-center justify-center bg-surface-secondary",
          type === "artist" ? "rounded-full" : "rounded-xl"
        )}
      >
        {type === "artist" ? (
          <LocalUserSolidIcon fill="none" width={32} height={32} color={muted} />
        ) : type === "folder" ? (
          <LocalFolder01SolidIcon fill="none" width={32} height={32} color={muted} />
        ) : (
          <LocalMusicNote04SolidIcon fill="none" width={32} height={32} color={muted} />
        )}
      </View>
    )
  }

  return (
    <ActionSheet.Root isOpen={visible} onOpenChange={onOpenChange}>
      <ActionSheet.Content
        enableDynamicSizing={true}
        contentContainerClassName="px-5 pt-2 pb-safe-offset-4"
      >
        <View className="mb-5 flex-row items-center gap-4">
          {renderArtworkHeader()}
          <View className="flex-1 gap-1">
            <Text className="text-xl leading-7 font-bold text-foreground" numberOfLines={1}>
              {name}
            </Text>
            {subtitle ? (
              <Text className="text-sm text-muted" numberOfLines={2}>
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
                  <LocalFavouriteSolidIcon fill="none" width={22} height={22} color={danger} />
                ) : (
                  <LocalFavouriteIcon fill="none" width={22} height={22} color={muted} />
                )
              }
              label={isFavorite ? t("track.removeFromFavorites") : t("track.addToFavorites")}
              onPress={() => {
                void handleToggleFavorite()
              }}
            />
          )}
          <MenuRow
            icon={<LocalNextIcon fill="none" width={22} height={22} color={muted} />}
            label={t("track.playNext")}
            onPress={() => {
              void handlePlayNext()
            }}
          />
          <MenuRow
            icon={<LocalAddCircleIcon fill="none" width={22} height={22} color={muted} />}
            label={t("track.addToQueue")}
            onPress={() => {
              void handleAddQueue()
            }}
          />
          {children}
        </View>
      </ActionSheet.Content>
    </ActionSheet.Root>
  )
}
