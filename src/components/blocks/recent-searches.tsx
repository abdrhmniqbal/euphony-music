/**
 * Purpose: Renders recent-search rows with type badges, consistent subtitles, and playlist artwork grids.
 * Caller: Search interaction screen.
 * Dependencies: HeroUI chips, media item UI, playlist artwork, localization, theme colors.
 * Main Functions: RecentSearches()
 * Side Effects: Clears and removes recent-search rows from the local recent-search list.
 */

import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { useCallback } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

import LocalCancelIcon from "@/components/icons/local/cancel"
import LocalClockSolidIcon from "@/components/icons/local/clock-solid"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import LocalUserIcon from "@/components/icons/local/user"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import {
  MediaItem as Item,
  MediaItemAction as ItemAction,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { Chip } from "heroui-native"
import { useThemeColors } from "@/modules/ui/theme"

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

interface RecentSearchRowProps {
  item: RecentSearchItem
  icon: React.ReactNode
  mutedColor: string
  onPress: (item: RecentSearchItem) => void
  onRemove: (id: string) => void
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

function RecentSearchRow({ item, icon, mutedColor, onPress, onRemove }: RecentSearchRowProps) {
  const imageClassName = item.type === "artist" ? "rounded-full" : "rounded-md"

  return (
    <Item onPress={() => onPress(item)}>
      {item.type === "playlist" ? (
        <ItemImage className="items-center justify-center overflow-hidden rounded-md bg-default">
          <PlaylistArtwork images={resolvePlaylistArtworkImages(item.images, item.image)} />
        </ItemImage>
      ) : (
        <ItemImage icon={icon} image={item.image} className={imageClassName} />
      )}
      <ItemContent>
        <ItemTitle>{item.title}</ItemTitle>
        <View className="flex-row items-center">
          {item.type ? <TypeBadge type={item.type} /> : null}
          <ItemDescription>{item.subtitle}</ItemDescription>
        </View>
      </ItemContent>
      <ItemAction className="p-2" onPress={() => onRemove(item.id)}>
        <LocalCancelIcon fill="none" width={20} height={20} color={mutedColor} />
      </ItemAction>
    </Item>
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
    (type?: string) => {
      switch (type) {
        case "artist":
          return <LocalUserIcon fill="none" width={24} height={24} color={theme.muted} />
        case "album":
          return <LocalVynilSolidIcon fill="none" width={24} height={24} color={theme.muted} />
        case "playlist":
          return <LocalPlaylistSolidIcon fill="none" width={24} height={24} color={theme.muted} />
        default:
          return <LocalClockSolidIcon fill="none" width={24} height={24} color={theme.muted} />
      }
    },
    [theme.muted]
  )

  if (searches.length === 0) {
    return null
  }

  return (
    <View className="px-4 py-4">
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">{t("search.recentSearches")}</Text>
        <PressableFeedback className="active:opacity-50" onPress={onClear}>
          <Text className="text-muted">{t("common.clear")}</Text>
        </PressableFeedback>
      </View>
      <View className="gap-2">
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
