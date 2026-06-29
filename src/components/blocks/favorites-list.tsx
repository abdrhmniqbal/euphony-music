/**
 * Purpose: Renders favorite media rows with type filters that reorder selected chips, sort reset support, and favorite removal actions.
 * Caller: Library favorites tab.
 * Dependencies: LegendList, media item UI, favorite mutations, router, playback service, player store, filter chips, localization, scroll reset behavior.
 * Main Functions: FavoritesList()
 * Side Effects: Navigates to favorite media routes, starts favorite track playback, and toggles favorite flags.
 */

import type { FavoriteEntry, FavoriteType } from "@/modules/favorites/types"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Chip } from "heroui-native"
import type { TFunction } from "i18next"
import * as React from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  type RefreshControlProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"
import { LEGEND_LIST_ROW_CONFIG } from "@/components/blocks/legend-list-config"
import { CollectionActionSheet } from "@/components/blocks/sheets/collection-action-sheet"
import { TrackActionSheet } from "@/components/blocks/sheets/track-action-sheet"
import { useActionSheet } from "@/components/blocks/use-action-sheet"
import { MemoizedFavoriteRow } from "@/components/blocks/favorites-row"
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ICON_SIZES } from "@/constants/icon-sizes"
import {
  resolveAlbumTransitionId,
  resolvePlaylistTransitionId,
} from "@/modules/artists/artist-transition"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { usePlayerTracks } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useThemeColors } from "@/modules/ui/theme"
import { createFavoritesQueueContext } from "@/stores/playback/types"

type CollectionFavoriteType = Extract<FavoriteType, "artist" | "album" | "playlist">
type CollectionFavoriteEntry = FavoriteEntry & { type: CollectionFavoriteType }

function isCollectionFavoriteEntry(
  favorite: FavoriteEntry | null | undefined
): favorite is CollectionFavoriteEntry {
  return favorite?.type === "artist" || favorite?.type === "album" || favorite?.type === "playlist"
}

import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"

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
}) => {
  const theme = useThemeColors()
  const tracks = usePlayerTracks()
  const { t } = useTranslation()
  const toggleFavoriteMutation = useToggleFavorite()
  const router = useRouter()
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const { selected: selectedFavorite, isOpen: isSheetOpen, handleLongPress, closeSheet } = useActionSheet<FavoriteEntry>()
  const visibleFavoriteTypes = FAVORITE_TYPE_FILTERS.filter((type) => availableTypes.includes(type))
  const orderedFavoriteTypes = [
    ...selectedTypes.filter((type) => visibleFavoriteTypes.includes(type)),
    ...visibleFavoriteTypes.filter((type) => !selectedTypes.includes(type)),
  ]
  const listContentContainerStyle = StyleSheet.flatten([{ gap: 8 }, contentContainerStyle])

  const autoHideScrollProps = useAutoHideHeaderScroll()

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
            playTrack(track, tracks, createFavoritesQueueContext(t("library.favorites")))
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
    [onTrackPress, router, t, tracks]
  )

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
    }
  }, [selectedFavorite, tracks])

  const selectedCollectionFavorite = React.useMemo<CollectionFavoriteEntry | null>(() => {
    return isCollectionFavoriteEntry(selectedFavorite) ? selectedFavorite : null
  }, [selectedFavorite])

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
        {...autoHideScrollProps}
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
        visible={isSheetOpen && Boolean(selectedCollectionFavorite)}
        onOpenChange={(open) => {
          if (!open) {
            closeSheet()
          }
        }}
        type={selectedCollectionFavorite?.type ?? "album"}
        id={selectedCollectionFavorite?.id ?? ""}
        name={selectedCollectionFavorite?.name ?? ""}
        subtitle={selectedCollectionFavorite?.subtitle}
        image={selectedCollectionFavorite?.image}
        images={selectedCollectionFavorite?.images}
      />
      <TrackActionSheet
        track={mappedTrack}
        isOpen={isSheetOpen && isTrackType}
        onClose={closeSheet}
        tracks={tracks}
        queueContext={createFavoritesQueueContext(t("library.favorites"))}
      />
    </View>
  )
}
