import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import * as React from "react"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native"
import { useTranslation } from "react-i18next"
import Transition from "react-native-screen-transitions"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import {
  LEGEND_LIST_GRID_CONFIG,
  LEGEND_LIST_GRID_HORIZONTAL_CONFIG,
} from "@/components/blocks/legend-list-config"
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { EmptyState } from "@/components/ui/empty-state"
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

const GAP = 16
const NUM_COLUMNS = 2
const HORIZONTAL_PADDING = 32
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
  const [selectedAlbum, setSelectedAlbum] = React.useState<Album | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const { width: windowWidth } = useWindowDimensions()
  const itemWidth = (windowWidth - HORIZONTAL_PADDING - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
  const estimatedAlbumItemHeight = itemWidth + 52
  const gridContentContainerStyle = StyleSheet.flatten([
    { paddingBottom: 8 },
    contentContainerStyle,
  ])
  const handlePress = (album: Album) => {
    onAlbumPress?.(album)
  }

  const handleLongPress = (album: Album) => {
    setSelectedAlbum(album)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
  }

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

  const renderAlbumItem = (item: Album) => (
    <Item
      variant="grid"
      className="w-full"
      boundaryId={resolveAlbumTransitionId({ id: item.id, title: item.title })}
      onPress={() => handlePress(item)}
      onLongPress={() => handleLongPress(item)}
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
  )

  if (data.length === 0) {
    return (
      <EmptyState
        icon={
          <LocalVynil02SolidIcon
            fill="none"
            width={ICON_SIZES.emptyState}
            height={ICON_SIZES.emptyState}
            color={theme.muted}
          />
        }
        title={t("library.empty.albumsTitle")}
        message={t("library.empty.albumsMessage")}
      />
    )
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
                onPress={() => handlePress(item)}
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
    <View style={{ flex: 1 }}>
      <LegendList
        ref={listRef}
        {...listBehaviorProps}
        data={data}
        renderItem={({ item, index }: LegendListRenderItemProps<Album>) => {
          const column = index % NUM_COLUMNS
          return (
            <View
              style={{
                width: itemWidth,
                marginRight: column < NUM_COLUMNS - 1 ? GAP : 0,
                marginBottom: GAP,
              }}
            >
              {renderAlbumItem(item)}
            </View>
          )
        }}
        keyExtractor={(item) => item.id}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={gridContentContainerStyle}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={refreshControl || undefined}
        style={{ flex: 1, minHeight: 1 }}
        className={containerClassName}
        {...LEGEND_LIST_GRID_CONFIG}
        estimatedItemSize={estimatedAlbumItemHeight}
      />
      {sheet}
    </View>
  )
}
