import { Image } from "expo-image"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import * as React from "react"

import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalNextIcon from "@/components/icons/local/next"
import LocalAddCircleIcon from "@/components/icons/local/add-circle"
import { ActionSheet } from "@/components/ui/action-sheet"
import { MenuRow } from "@/components/ui/menu-row"
import { useIsFavorite } from "@/domains/favorites/queries"
import { useToggleFavorite } from "@/domains/favorites/mutations"
import type { FavoriteType } from "@/domains/favorites/types"
import { getQueueSourceTrackIds } from "@/domains/library/queue-sources"
import { addCollectionToQueue, queueCollectionNext } from "@/playback/queue-actions"
import { showAppToast } from "@/core/ui/toast"
import { useThemeColors } from "@/core/theme/use-theme-colors"

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

  return (
    <ActionSheet.Root isOpen={visible} onOpenChange={onOpenChange}>
      <ActionSheet.Content className="pb-8">
        <View className="mb-4 mt-2 flex-row items-center gap-3 px-1">
          {image ? (
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
                  <LocalFavouriteSolidIcon fill="none" width={22} height={22} color={theme.danger} />
                ) : (
                  <LocalFavouriteIcon fill="none" width={22} height={22} color={theme.muted} />
                )
              }
              label={isFavorite ? t("track.removeFromFavorites") : t("track.addToFavorites")}
              onPress={() => {
                void handleToggleFavorite()
              }}
            />
          )}
          <MenuRow
            icon={<LocalNextIcon fill="none" width={22} height={22} color={theme.muted} />}
            label={t("track.playNext")}
            onPress={() => {
              void handlePlayNext()
            }}
          />
          <MenuRow
            icon={<LocalAddCircleIcon fill="none" width={22} height={22} color={theme.muted} />}
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
