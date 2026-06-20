/**
 * Purpose: Renders favorite media rows with type filters that reorder selected chips, sort reset support, and favorite removal actions.
 * Caller: Library favorites tab.
 * Dependencies: LegendList, media item UI, favorite mutations, router, playback service, player store, filter chips, localization, scroll reset behavior.
 * Main Functions: FavoritesList()
 * Side Effects: Navigates to favorite media routes, starts favorite track playback, and toggles favorite flags.
 */

import type { FavoriteEntry, FavoriteType } from "@/modules/favorites/types"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { Image } from "expo-image"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Chip, PressableFeedback } from "heroui-native"
import type { TFunction } from "i18next"
import * as React from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"
import { LEGEND_LIST_ROW_CONFIG } from "@/components/blocks/legend-list-config"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import { EmptyState } from "@/components/ui/empty-state"
import {
  MediaItem as Item,
  MediaItemAction as ItemAction,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { ICON_SIZES } from "@/constants/icon-sizes"
import {
  resolveAlbumTransitionId,
  resolvePlaylistTransitionId,
} from "@/modules/artists/artist-transition"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { usePlayerTracks } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useThemeColors } from "@/modules/ui/theme"

interface FavoritesListProps {
  data: FavoriteEntry[]
  availableTypes?: FavoriteType[]
  scrollEnabled?: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  resetScrollKey?: string
  selectedTypes?: FavoriteType[]
  onSelectedTypesChange?: (types: FavoriteType[]) => void
  onTrackPress?: (trackId: string) => void
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

interface FavoriteRowProps {
  favorite: FavoriteEntry
  onPress: (favorite: FavoriteEntry) => void
  onLongPress: (favorite: FavoriteEntry) => void
  onRemove: (favorite: FavoriteEntry) => void
}

const FavoriteItemImage: React.FC<{ favorite: FavoriteEntry }> = ({ favorite }) => {
  const theme = useThemeColors()

  switch (favorite.type) {
    case "artist":
      return (
        <ItemImage className="overflow-hidden rounded-full">
          {favorite.image ? (
            <Image
              source={{ uri: favorite.image }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center rounded-full bg-surface">
              <LocalUserSolidIcon
                fill="none"
                width={ICON_SIZES.listFallback}
                height={ICON_SIZES.listFallback}
                color={theme.muted}
              />
            </View>
          )}
        </ItemImage>
      )

    case "playlist":
      return (
        <ItemImage className="items-center justify-center overflow-hidden bg-default">
          <PlaylistArtwork images={resolvePlaylistArtworkImages(favorite.images, favorite.image)} />
        </ItemImage>
      )

    case "album":
      return (
        <ItemImage
          icon={
            <LocalVynilSolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={theme.muted}
            />
          }
          image={favorite.image}
          className="rounded-lg"
        />
      )

    case "track":
    default:
      return (
        <ItemImage
          icon={
            <LocalMusicNoteSolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={theme.muted}
            />
          }
          image={favorite.image}
        />
      )
  }
}

const TypeBadge: React.FC<{ type: FavoriteType }> = ({ type }) => {
  const { t } = useTranslation()
  const label = (() => {
    switch (type) {
      case "track":
        return t("library.favoriteType.track")
      case "artist":
        return t("library.favoriteType.artist")
      case "album":
        return t("library.favoriteType.album")
      case "playlist":
        return t("library.favoriteType.playlist")
      default:
        return type
    }
  })()

  return (
    <Chip size="sm" variant="secondary" color="default" className="mr-2">
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  )
}

function FavoriteRow({ favorite, onPress, onLongPress, onRemove }: FavoriteRowProps) {
  const theme = useThemeColors()
  const handlePress = useCallback(() => {
    onPress(favorite)
  }, [favorite, onPress])

  const handleLongPress = useCallback(() => {
    onLongPress(favorite)
  }, [favorite, onLongPress])

  const handleRemove = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation()
      onRemove(favorite)
    },
    [favorite, onRemove]
  )

  return (
    <Item onPress={handlePress} onLongPress={handleLongPress}>
      <FavoriteItemImage favorite={favorite} />
      <ItemContent>
        <ItemTitle>{favorite.name}</ItemTitle>
        <View className="flex-row items-center">
          <TypeBadge type={favorite.type} />
          <ItemDescription>{favorite.subtitle || ""}</ItemDescription>
        </View>
      </ItemContent>
      <ItemAction>
        <PressableFeedback onPress={handleRemove} className="p-2 active:opacity-50">
          <LocalFavouriteSolidIcon fill="none" width={22} height={22} color={theme.danger} />
        </PressableFeedback>
      </ItemAction>
    </Item>
  )
}

const MemoizedFavoriteRow = React.memo(FavoriteRow)

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

export const FavoritesList: React.FC<FavoritesListProps> = ({
  data,
  availableTypes = [],
  scrollEnabled = true,
  contentContainerStyle,
  refreshControl,
  resetScrollKey,
  selectedTypes = [],
  onSelectedTypesChange,
  onTrackPress,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
}) => {
  const theme = useThemeColors()
  const tracks = usePlayerTracks()
  const { t } = useTranslation()
  const toggleFavoriteMutation = useToggleFavorite()
  const router = useRouter()
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const [selectedFavorite, setSelectedFavorite] = React.useState<FavoriteEntry | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const visibleFavoriteTypes = FAVORITE_TYPE_FILTERS.filter((type) => availableTypes.includes(type))
  const orderedFavoriteTypes = [
    ...selectedTypes.filter((type) => visibleFavoriteTypes.includes(type)),
    ...visibleFavoriteTypes.filter((type) => !selectedTypes.includes(type)),
  ]
  const listContentContainerStyle = StyleSheet.flatten([{ gap: 8 }, contentContainerStyle])

  const toggleTypeFilter = useCallback(
    (type: FavoriteType) => {
      const nextTypes = selectedTypes.includes(type)
        ? selectedTypes.filter((item) => item !== type)
        : [...selectedTypes, type]
      onSelectedTypesChange?.(nextTypes)
    },
    [onSelectedTypesChange, selectedTypes]
  )

  const handlePress = useCallback(
    (favorite: FavoriteEntry) => {
      switch (favorite.type) {
        case "track": {
          if (onTrackPress) {
            onTrackPress(favorite.id)
            break
          }
          const track = tracks.find((item) => item.id === favorite.id)
          if (track) {
            playTrack(track, tracks)
          }
          break
        }
        case "artist": {
          router.push({
            pathname: "/artist/[name]",
            params: { name: favorite.name },
          })
          break
        }
        case "album": {
          router.push({
            pathname: "/album/[name]",
            params: {
              name: favorite.name,
              transitionId: resolveAlbumTransitionId({
                id: favorite.id,
                title: favorite.name,
              }),
            },
          })
          break
        }
        case "playlist": {
          router.push({
            pathname: "/playlist/[id]",
            params: {
              id: favorite.id,
              transitionId: resolvePlaylistTransitionId({
                id: favorite.id,
                title: favorite.name,
              }),
            },
          })
          break
        }
      }
    },
    [onTrackPress, router, tracks]
  )

  const handleLongPress = useCallback((favorite: FavoriteEntry) => {
    setSelectedFavorite(favorite)
    setIsSheetOpen(true)
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

  const isTrackType = selectedFavorite?.type === "track"

  const mappedTrack = React.useMemo(() => {
    if (!selectedFavorite || selectedFavorite.type !== "track") return null
    const realTrack = tracks.find((t) => t.id === selectedFavorite.id)
    if (realTrack) return realTrack

    return {
      id: selectedFavorite.id,
      title: selectedFavorite.name,
      artist: selectedFavorite.subtitle,
      image: selectedFavorite.image,
      duration: 0,
      uri: "",
    } as any
  }, [selectedFavorite, tracks])

  return (
    <View style={{ flex: 1, minHeight: 1 }}>
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
        ref={listRef}
        {...listBehaviorProps}
        data={data}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        getItemType={(item) => item.type}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={listContentContainerStyle}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        refreshControl={refreshControl || undefined}
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
        {...LEGEND_LIST_ROW_CONFIG}
        style={{ flex: 1, minHeight: 1 }}
      />
      <CollectionActionSheet
        visible={isSheetOpen && !isTrackType && Boolean(selectedFavorite)}
        onOpenChange={(open) => {
          if (!open) {
            setIsSheetOpen(false)
          }
        }}
        type={selectedFavorite?.type as any}
        id={selectedFavorite?.id ?? ""}
        name={selectedFavorite?.name ?? ""}
        subtitle={selectedFavorite?.subtitle}
        image={selectedFavorite?.image}
        images={selectedFavorite?.images}
      />
      <TrackActionSheet
        track={mappedTrack}
        isOpen={isSheetOpen && isTrackType}
        onClose={() => setIsSheetOpen(false)}
        tracks={tracks}
      />
    </View>
  )
}
