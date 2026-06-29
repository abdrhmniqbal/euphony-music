import * as React from "react"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native"
import { useTranslation } from "react-i18next"
import Transition from "react-native-screen-transitions"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { GridList } from "@/components/blocks/grid-list"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import {
  MediaItem as Item,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { resolveArtistTransitionId } from "@/modules/artists/artist-transition"
import { useThemeColors } from "@/modules/ui/theme"

export interface Artist {
  id: string
  name: string
  trackCount: number
  image?: string
  dateAdded: number
}

interface ArtistGridProps {
  data: Artist[]
  onArtistPress?: (artist: Artist) => void
  onArtistLongPress?: (artist: Artist) => void
  scrollEnabled?: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
  resetScrollKey?: string
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  refreshControl?: React.ReactElement<RefreshControlProps> | null
}

export const ArtistGrid: React.FC<ArtistGridProps> = ({
  data,
  onArtistPress,
  onArtistLongPress,
  scrollEnabled = true,
  contentContainerStyle,
  resetScrollKey,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  refreshControl,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()

  const formatTrackCount = (count: number) => t("library.count.track", { count })

  return (
    <GridList
      data={data}
      keyExtractor={(item: Artist) => item.id}
      numColumns={3}
      gap={12}
      estimatedItemHeight={(w: number) => w + 48}
      emptyState={{
        icon: (
          <LocalUserSolidIcon
            fill="none"
            width={ICON_SIZES.emptyState}
            height={ICON_SIZES.emptyState}
            color={theme.muted}
          />
        ),
        title: t("library.empty.artistsTitle"),
        message: t("library.empty.artistsMessage"),
      }}
      renderSheet={(selected, closeSheet, isOpen) => (
        <CollectionActionSheet
          visible={isOpen && Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) {
              closeSheet()
            }
          }}
          type="artist"
          id={selected.id}
          name={selected.name}
          subtitle={formatTrackCount(selected.trackCount)}
          image={selected.image}
          trackCount={selected.trackCount}
        />
      )}
      scrollEnabled={scrollEnabled}
      contentContainerStyle={contentContainerStyle}
      resetScrollKey={resetScrollKey}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      refreshControl={refreshControl}
      renderItem={(item, { onLongPress, itemWidth, column }) => (
        <View style={{ width: itemWidth, marginRight: column < 2 ? 12 : 0, marginBottom: 12 }}>
          <Item
            variant="grid"
            boundaryId={resolveArtistTransitionId({ id: item.id, name: item.name })}
            onPress={() => onArtistPress?.(item)}
            onLongPress={onLongPress}
          >
            <Transition.Boundary.Target>
              <ItemImage
                icon={
                  <LocalUserSolidIcon
                    fill="none"
                    width={ICON_SIZES.gridFallback}
                    height={ICON_SIZES.gridFallback}
                    color={theme.muted}
                  />
                }
                image={item.image}
                className="aspect-square w-full rounded-full bg-default"
              />
            </Transition.Boundary.Target>
            <ItemContent className="mt-1 items-center">
              <ItemTitle className="text-center text-sm normal-case" numberOfLines={1}>
                {item.name}
              </ItemTitle>
              <ItemDescription className="text-center">
                {formatTrackCount(item.trackCount)}
              </ItemDescription>
            </ItemContent>
          </Item>
        </View>
      )}
    />
  )
}
