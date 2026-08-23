import { Image } from "expo-image"
import type { LegendListRenderItemProps } from "@legendapp/list/react-native"
import { LegendList } from "@legendapp/list/react-native"
import { Chip, PressableFeedback } from "heroui-native"
import type { TFunction } from "i18next"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import {
  MediaItem,
  MediaItemAction,
  MediaItemContent,
  MediaItemDescription,
  MediaItemImage,
  MediaItemTitle,
} from "@/components/ui/media-item"
import { EmptyState } from "@/components/ui/empty-state"
import { PlaylistArtwork, resolvePlaylistArtworkImages } from "@/components/patterns/playlist-artwork"
import { ICON_SIZES } from "@/lib/layout"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { useGuardedRouter } from "@/core/navigation"
import type { FavoriteEntry, FavoriteType } from "@/domains/favorites/types"
import { useToggleFavorite } from "@/domains/favorites/mutations"
import { playTrack } from "@/playback/service"
import { createPlaybackQueueContext } from "@/playback/types"
import type { PlayerTrack } from "@/playback/types"

type CollectionFavoriteType = Extract<FavoriteType, "artist" | "album" | "playlist">
type CollectionFavoriteEntry = FavoriteEntry & { type: CollectionFavoriteType }

function isCollectionFavoriteEntry(
  favorite: FavoriteEntry | null | undefined
): favorite is CollectionFavoriteEntry {
  return favorite?.type === "artist" || favorite?.type === "album" || favorite?.type === "playlist"
}

const FAVORITE_TYPE_FILTERS: FavoriteType[] = ["track", "album", "artist", "playlist"]

function getFavoriteTypeLabel(type: FavoriteType, t: TFunction) {
  switch (type) {
    case "track":
      return t("library.favoriteType.track")
    case "artist":
      return t("library.favoriteType.artist")
    case "album":
      return t("library.favoriteType.album")
    case "playlist":
      return t("library.favoriteType.playlist")
  }
}

function FavoriteItemImage({ favorite }: { favorite: FavoriteEntry }) {
  const theme = useThemeColors()

  if (favorite.type === "artist") {
    return (
      <MediaItemImage className="overflow-hidden rounded-full">
        {favorite.image ? (
          <View className="h-full w-full overflow-hidden rounded-full">
            <Image source={{ uri: favorite.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          </View>
        ) : (
          <View className="h-full w-full items-center justify-center rounded-full bg-surface">
            <LocalUserSolidIcon fill="none" width={ICON_SIZES.listFallback} height={ICON_SIZES.listFallback} color={theme.muted} />
          </View>
        )}
      </MediaItemImage>
    )
  }

  if (favorite.type === "playlist") {
    return (
      <MediaItemImage className="items-center justify-center overflow-hidden bg-default">
        <PlaylistArtwork images={resolvePlaylistArtworkImages(favorite.images, favorite.image)} />
      </MediaItemImage>
    )
  }

  if (favorite.type === "album") {
    return (
      <MediaItemImage
        icon={
          <LocalVynil02SolidIcon fill="none" width={ICON_SIZES.listFallback} height={ICON_SIZES.listFallback} color={theme.muted} />
        }
        image={favorite.image}
      />
    )
  }

  return (
    <MediaItemImage
      icon={
        favorite.image ? (
          <View className="h-full w-full overflow-hidden rounded-lg">
            <Image source={{ uri: favorite.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          </View>
        ) : (
          <LocalMusicNote04SolidIcon fill="none" width={ICON_SIZES.listFallback} height={ICON_SIZES.listFallback} color={theme.muted} />
        )
      }
    />
  )
}

function TypeBadge({ type }: { type: FavoriteType }) {
  const { t } = useTranslation()
  return (
    <View className="mr-2 rounded-md bg-surface px-1.5 py-0.5">
      <Text className="text-[10px] font-semibold uppercase text-muted">
        {getFavoriteTypeLabel(type, t)}
      </Text>
    </View>
  )
}

interface FavoriteRowProps {
  favorite: FavoriteEntry
  onPress: (favorite: FavoriteEntry) => void
  onLongPress: (favorite: FavoriteEntry) => void
  onRemove: (favorite: FavoriteEntry) => void
}

function FavoriteRow({ favorite, onPress, onLongPress, onRemove }: FavoriteRowProps) {
  const handlePress = useCallback(() => onPress(favorite), [favorite, onPress])
  const handleLongPress = useCallback(() => onLongPress(favorite), [favorite, onLongPress])
  const handleRemove = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation()
      onRemove(favorite)
    },
    [favorite, onRemove]
  )

  return (
    <MediaItem onPress={handlePress} onLongPress={handleLongPress}>
      <FavoriteItemImage favorite={favorite} />
      <MediaItemContent>
        <MediaItemTitle>{favorite.name}</MediaItemTitle>
        <View className="flex-row items-center">
          <TypeBadge type={favorite.type} />
          <MediaItemDescription>{favorite.subtitle || ""}</MediaItemDescription>
        </View>
      </MediaItemContent>
      <MediaItemAction>
        <PressableFeedback onPress={handleRemove} className="p-2 active:opacity-50">
          <LocalFavouriteSolidIcon fill="none" width={22} height={22} color="#f43f5e" />
        </PressableFeedback>
      </MediaItemAction>
    </MediaItem>
  )
}

const MemoizedFavoriteRow = React.memo(FavoriteRow)

interface FavoritesListProps {
  data: FavoriteEntry[]
  availableTypes?: FavoriteType[]
  contentContainerStyle?: Record<string, unknown>
  selectedTypes: FavoriteType[]
  onSelectedTypesChange: (types: FavoriteType[]) => void
}

export function FavoritesList({
  data,
  availableTypes = [],
  contentContainerStyle,
  selectedTypes,
  onSelectedTypesChange,
}: FavoritesListProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const router = useGuardedRouter()
  const toggleFavoriteMutation = useToggleFavorite()
  const autoHideScrollProps = useAutoHideHeaderScroll()
  const [selectedFavorite, setSelectedFavorite] = useState<FavoriteEntry | null>(null)
  const [isCollectionSheetOpen, setIsCollectionSheetOpen] = useState(false)
  const [isTrackSheetOpen, setIsTrackSheetOpen] = useState(false)

  const visibleFavoriteTypes = FAVORITE_TYPE_FILTERS.filter((type) => availableTypes.includes(type))
  const orderedFavoriteTypes = [
    ...selectedTypes.filter((type) => visibleFavoriteTypes.includes(type)),
    ...visibleFavoriteTypes.filter((type) => !selectedTypes.includes(type)),
  ]
  const listContentContainerStyle = StyleSheet.flatten([
    { gap: 8 },
    contentContainerStyle as never,
  ])

  const toggleTypeFilter = useCallback(
    (type: FavoriteType) => {
      const nextTypes = selectedTypes.includes(type)
        ? selectedTypes.filter((item) => item !== type)
        : [...selectedTypes, type]
      onSelectedTypesChange?.(nextTypes)
    },
    [onSelectedTypesChange, selectedTypes]
  )

  const handleLongPress = useCallback((favorite: FavoriteEntry) => {
    setSelectedFavorite(favorite)
    if (isCollectionFavoriteEntry(favorite)) {
      setIsCollectionSheetOpen(true)
    } else {
      setIsTrackSheetOpen(true)
    }
  }, [])

  const closeSheets = useCallback(() => {
    setIsCollectionSheetOpen(false)
    setIsTrackSheetOpen(false)
  }, [])

  const handleRemoveFavorite = useCallback(
    (favorite: FavoriteEntry) => {
      void toggleFavoriteMutation.mutateAsync({
        type: favorite.type,
        itemId: favorite.id,
        isCurrentlyFavorite: true,
        name: favorite.name,
        subtitle: favorite.subtitle,
        image: favorite.image,
      })
    },
    [toggleFavoriteMutation]
  )

  const handlePress = useCallback(
    (favorite: FavoriteEntry) => {
      switch (favorite.type) {
        case "track": {
          const queue = data
            .filter((item): item is FavoriteEntry & { type: "track" } => item.type === "track")
            .map((entry): PlayerTrack => ({
              id: entry.id,
              title: entry.name,
              artist: entry.subtitle,
              duration: 0,
              uri: "",
              image: entry.image,
            }))
          const index = queue.findIndex((track) => track.id === favorite.id)
          const active = queue[index]
          if (active) {
            void playTrack(
              active,
              queue,
              createPlaybackQueueContext("favorites", t("term.favoritesLabel"))
            )
          }
          break
        }
        case "artist":
          router.push({ pathname: "/artist/[name]", params: { name: favorite.name } })
          break
        case "album":
          router.push({ pathname: "/album/[name]", params: { name: favorite.name } })
          break
        case "playlist":
          router.push({ pathname: "/playlist/[id]", params: { id: favorite.id } })
          break
      }
    },
    [data, router, t]
  )

  const renderFavoriteItem = useCallback(
    ({ item }: LegendListRenderItemProps<FavoriteEntry>) => (
      <MemoizedFavoriteRow
        favorite={item}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onRemove={handleRemoveFavorite}
      />
    ),
    [handlePress, handleLongPress, handleRemoveFavorite]
  )

  const collectionFavorite = useMemo(
    () => (isCollectionFavoriteEntry(selectedFavorite) ? selectedFavorite : null),
    [selectedFavorite]
  )

  const mappedTrackSheet = useMemo<PlayerTrack | null>(() => {
    if (!selectedFavorite || collectionFavorite) return null
    return {
      id: selectedFavorite.id,
      title: selectedFavorite.name,
      artist: selectedFavorite.subtitle,
      duration: 0,
      uri: "",
      image: selectedFavorite.image,
    }
  }, [selectedFavorite, collectionFavorite])

  return (
    <View style={{ flex: 1 }}>
      {orderedFavoriteTypes.length > 0 ? (
        <View className="mb-3 flex-row flex-wrap gap-2">
          {orderedFavoriteTypes.map((type) => {
            const isSelected = selectedTypes.includes(type)

            return (
              <Chip
                key={type}
                size="lg"
                variant={isSelected ? "primary" : "soft"}
                color={isSelected ? "accent" : "default"}
                onPress={() => toggleTypeFilter(type)}
              >
                <Chip.Label>{getFavoriteTypeLabel(type, t)}</Chip.Label>
              </Chip>
            )
          })}
        </View>
      ) : null}
      <LegendList
        data={data}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        getItemType={(item) => item.type}
        contentContainerStyle={listContentContainerStyle}
        {...autoHideScrollProps}
        recycleItems
        estimatedItemSize={72}
        ListEmptyComponent={
          <EmptyState
            icon={
              <LocalFavouriteSolidIcon
                fill="none"
                width={ICON_SIZES.emptyState}
                height={ICON_SIZES.emptyState}
                color={theme.danger}
              />
            }
            title={t("library.empty.favoritesTitle")}
            message={t("library.empty.favoritesMessage")}
          />
        }
        style={{ flex: 1, minHeight: 1 }}
      />
      <CollectionActionSheet
        visible={isCollectionSheetOpen && Boolean(collectionFavorite)}
        onOpenChange={(open) => {
          if (!open) setIsCollectionSheetOpen(false)
        }}
        type={collectionFavorite?.type ?? "album"}
        id={collectionFavorite?.id ?? ""}
        name={collectionFavorite?.name ?? ""}
        subtitle={collectionFavorite?.subtitle}
        image={collectionFavorite?.image}
        images={collectionFavorite?.images}
      />
      <TrackActionSheet
        track={mappedTrackSheet}
        isOpen={isTrackSheetOpen && !collectionFavorite}
        onClose={() => {
          setIsTrackSheetOpen(false)
        }}
      />
    </View>
  )
}

export default FavoritesList
