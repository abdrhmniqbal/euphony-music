import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { GridList } from "@/components/blocks/grid-list"
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
import { CollectionActionSheet } from "@/components/blocks/sheets/collection-action-sheet"
import { LEGEND_LIST_GRID_HORIZONTAL_CONFIG } from "@/components/blocks/legend-list-config"

import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import { useActionSheet } from "@/components/blocks/use-action-sheet"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import {
  MediaItem as Item,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { resolveAlbumTransitionId } from "@/modules/artists/artist-transition"
import { useThemeColors } from "@/modules/ui/theme"
import { mergeText } from "@/utils/merge-text"

export interface Album {
  id: string
  title: string
  artist: string
  albumArtist?: string
  image?: string
  trackCount: number
  year: number
  dateAdded: number
}

interface AlbumGridProps {
  data: Album[]
  onAlbumPress?: (album: Album) => void
  onAlbumLongPress?: (album: Album) => void
  horizontal?: boolean
  containerClassName?: string
  scrollEnabled?: boolean
  listHeader?: React.ReactElement | null
  listFooter?: React.ReactElement | null
  contentContainerStyle?: StyleProp<ViewStyle>
  showsVerticalScrollIndicator?: boolean
  scrollEventThrottle?: number
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  resetScrollKey?: string
}

const HORIZONTAL_ROW_HEIGHT = 208

export const AlbumGrid: React.FC<AlbumGridProps> = ({
  data,
  onAlbumPress,
  onAlbumLongPress,
  horizontal,
  containerClassName = "",
  scrollEnabled = true,
  listHeader = null,
  listFooter = null,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  scrollEventThrottle = 16,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  refreshControl,
  resetScrollKey,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const {
    selected: selectedAlbum,
    isOpen: isSheetOpen,
    handleLongPress,
    closeSheet,
  } = useActionSheet<Album>()
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)

  const sheet = (
    <CollectionActionSheet
      visible={isSheetOpen && Boolean(selectedAlbum)}
      onOpenChange={(open) => {
        if (!open) {
          closeSheet()
        }
      }}
      type="album"
      id={selectedAlbum?.id ?? ""}
      name={selectedAlbum?.title ?? ""}
      subtitle={selectedAlbum?.artist}
      image={selectedAlbum?.image}
      trackCount={selectedAlbum?.trackCount ?? 0}
    />
  )

  function getAlbumMetaText(item: Album) {
    return mergeText([
      item.albumArtist || item.artist,
      item.trackCount > 0 ? t("library.count.track", { count: item.trackCount }) : null,
    ])
  }

  if (horizontal) {
    return (
      <>
        <LegendList
          ref={listRef}
          {...listBehaviorProps}
          horizontal
          data={data}
          renderItem={({ item, index }: LegendListRenderItemProps<Album>) => (
            <View
              key={item.id}
              className="w-36"
              style={{ marginRight: index === data.length - 1 ? 0 : 16 }}
            >
              <Item
                variant="grid"
                boundaryId={resolveAlbumTransitionId({ id: item.id, title: item.title })}
                onPress={() => onAlbumPress?.(item)}
                onLongPress={() => handleLongPress(item)}
              >
                <Transition.Boundary.Target>
                  <ItemImage
                    icon={
                      <LocalVynil02SolidIcon
                        fill="none"
                        width={ICON_SIZES.mediumCardFallback}
                        height={ICON_SIZES.mediumCardFallback}
                        color={theme.muted}
                      />
                    }
                    image={item.image}
                    className="aspect-square w-full rounded-md"
                  />
                </Transition.Boundary.Target>
                <ItemContent className="mt-1">
                  <ItemTitle className="text-sm normal-case" numberOfLines={1}>
                    {item.title}
                  </ItemTitle>
                  <ItemDescription numberOfLines={1}>{getAlbumMetaText(item)}</ItemDescription>
                </ItemContent>
              </Item>
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 2, paddingBottom: 6 }}
          style={{ minHeight: HORIZONTAL_ROW_HEIGHT }}
          className={containerClassName}
          {...LEGEND_LIST_GRID_HORIZONTAL_CONFIG}
          estimatedItemSize={144}
        />
        {sheet}
      </>
    )
  }

  return (
    <GridList
      data={data}
      keyExtractor={(item: Album) => item.id}
      numColumns={2}
      gap={16}
      estimatedItemHeight={(w: number) => w + 52}
      emptyState={{
        icon: (
          <LocalVynil02SolidIcon
            fill="none"
            width={ICON_SIZES.emptyState}
            height={ICON_SIZES.emptyState}
            color={theme.muted}
          />
        ),
        title: t("library.empty.albumsTitle"),
        message: t("library.empty.albumsMessage"),
      }}
      renderSheet={(selected, closeSheet, isOpen) => (
        <CollectionActionSheet
          visible={isOpen && Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) {
              closeSheet()
            }
          }}
          type="album"
          id={selected?.id ?? ""}
          name={selected?.title ?? ""}
          subtitle={selected?.artist}
          image={selected?.image}
          trackCount={selected?.trackCount ?? 0}
        />
      )}
      scrollEnabled={scrollEnabled}
      containerClassName={containerClassName}
      listHeader={listHeader}
      listFooter={listFooter}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      refreshControl={refreshControl}
      resetScrollKey={resetScrollKey}
      renderItem={(item, { onLongPress, itemWidth, column }) => (
        <Item
          variant="grid"
          className="w-full"
          style={{
            width: itemWidth,
            marginRight: column < 1 ? 16 : 0,
            marginBottom: 16,
          }}
          boundaryId={resolveAlbumTransitionId({ id: item.id, title: item.title })}
          onPress={() => onAlbumPress?.(item)}
          onLongPress={onLongPress}
        >
          <Transition.Boundary.Target>
            <ItemImage
              icon={
                <LocalVynil02SolidIcon
                  fill="none"
                  width={ICON_SIZES.largeCardFallback}
                  height={ICON_SIZES.largeCardFallback}
                  color={theme.muted}
                />
              }
              image={item.image}
              className="aspect-square w-full rounded-md"
            />
          </Transition.Boundary.Target>
          <ItemContent className="mt-1">
            <ItemTitle className="text-sm normal-case" numberOfLines={1}>
              {item.title}
            </ItemTitle>
            <ItemDescription numberOfLines={1}>{getAlbumMetaText(item)}</ItemDescription>
          </ItemContent>
        </Item>
      )}
    />
  )
}
