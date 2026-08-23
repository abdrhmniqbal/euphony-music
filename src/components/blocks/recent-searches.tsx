import { Chip } from "heroui-native"
import * as React from "react"
import { useCallback } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import LocalClock01SolidIcon from "@/components/icons/local/clock-01-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalUserIcon from "@/components/icons/local/user"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import {
  MediaItem,
  MediaItemAction,
  MediaItemContent,
  MediaItemDescription,
  MediaItemImage,
  MediaItemTitle,
} from "@/components/ui/media-item"
import { PlaylistArtwork, resolvePlaylistArtworkImages } from "@/components/patterns/playlist-artwork"
import { ICON_SIZES } from "@/lib/layout"
import { useThemeColors } from "@/core/theme/use-theme-colors"

export interface RecentSearchItem {
  id: string
  query: string
  title: string
  subtitle: string
  type?: "track" | "album" | "artist" | "playlist"
  targetId?: string
  image?: string
  images?: string[]
}

interface RecentSearchesProps {
  searches: RecentSearchItem[]
  onClear: () => void
  onItemPress: (item: RecentSearchItem) => void
  onRemoveItem: (id: string) => void
}

function getRecentSearchTypeLabel(type: NonNullable<RecentSearchItem["type"]>, t: TFunction) {
  switch (type) {
    case "track":
      return t("library.favoriteType.track")
    case "album":
      return t("library.favoriteType.album")
    case "artist":
      return t("library.favoriteType.artist")
    case "playlist":
      return t("library.favoriteType.playlist")
  }
}

function TypeBadge({ type }: { type: NonNullable<RecentSearchItem["type"]> }) {
  const { t } = useTranslation()

  return (
    <Chip size="sm" variant="secondary" color="default" className="mr-2">
      <Chip.Label>{getRecentSearchTypeLabel(type, t)}</Chip.Label>
    </Chip>
  )
}

function RecentSearchRow({
  item,
  icon,
  mutedColor,
  onPress,
  onRemove,
}: {
  item: RecentSearchItem
  icon: React.ReactNode
  mutedColor: string
  onPress: (item: RecentSearchItem) => void
  onRemove: (id: string) => void
}) {
  return (
    <MediaItem onPress={() => onPress(item)}>
      {item.type === "playlist" ? (
        <MediaItemImage className="items-center justify-center overflow-hidden rounded-md bg-default">
          <PlaylistArtwork images={resolvePlaylistArtworkImages(item.images, item.image)} />
        </MediaItemImage>
      ) : (
        <MediaItemImage icon={icon} image={item.image} className={item.type === "artist" ? "rounded-full" : "rounded-md"} />
      )}
      <MediaItemContent>
        <MediaItemTitle>{item.title}</MediaItemTitle>
        <View className="flex-row items-center">
          {item.type ? <TypeBadge type={item.type} /> : null}
          <MediaItemDescription>{item.subtitle}</MediaItemDescription>
        </View>
      </MediaItemContent>
      <MediaItemAction className="p-2" onPress={() => onRemove(item.id)}>
        <LocalCancel01Icon fill="none" width={20} height={20} color={mutedColor} />
      </MediaItemAction>
    </MediaItem>
  )
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onClear,
  onItemPress,
  onRemoveItem,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()

  const getIconForType = useCallback(
    (type?: RecentSearchItem["type"]) => {
      switch (type) {
        case "artist":
          return <LocalUserIcon fill="none" width={ICON_SIZES.listFallback} height={ICON_SIZES.listFallback} color={theme.muted} />
        case "album":
          return <LocalVynil02SolidIcon fill="none" width={ICON_SIZES.listFallback} height={ICON_SIZES.listFallback} color={theme.muted} />
        case "track":
          return <LocalMusicNote04SolidIcon fill="none" width={ICON_SIZES.listFallback} height={ICON_SIZES.listFallback} color={theme.muted} />
        default:
          return <LocalClock01SolidIcon fill="none" width={22} height={22} color={theme.muted} />
      }
    },
    [theme.muted]
  )

  if (searches.length === 0) {
    return null
  }

  return (
    <View className="px-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-foreground">{t("search.recentTitle")}</Text>
        <Text className="text-sm text-muted" onPress={onClear}>
          {t("search.clearAll")}
        </Text>
      </View>
      <View className="gap-1">
        {searches.map((item) => (
          <RecentSearchRow
            key={item.id}
            item={item}
            icon={getIconForType(item.type)}
            mutedColor={theme.muted}
            onPress={onItemPress}
            onRemove={onRemoveItem}
          />
        ))}
      </View>
    </View>
  )
}
