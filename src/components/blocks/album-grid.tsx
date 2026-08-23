import type { LegendListRenderItemProps } from "@legendapp/list/react-native"
import { LegendList } from "@legendapp/list/react-native"
import * as React from "react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import {
  MediaItem,
  MediaItemContent,
  MediaItemDescription,
  MediaItemImage,
  MediaItemTitle,
} from "@/components/ui/media-item"
import { EmptyState } from "@/components/ui/empty-state"
import { ICON_SIZES } from "@/lib/layout"
import { mergeText } from "@/lib/merge-text"
import { useThemeColors } from "@/core/theme/use-theme-colors"

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
  horizontal?: boolean
  containerClassName?: string
  listHeader?: React.ReactElement | null
  contentContainerStyle?: Record<string, unknown>
  showsVerticalScrollIndicator?: boolean
  scrollEventThrottle?: number
  onScroll?: (event: { nativeEvent: { contentOffset: { y: number } } }) => void
}

const HORIZONTAL_ROW_HEIGHT = 208

function useAlbumActionSheet() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleLongPress = useCallback((album: Album) => {
    setSelectedAlbum(album)
    setIsSheetOpen(true)
  }, [])

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false)
  }, [])

  return { selectedAlbum, isSheetOpen, handleLongPress, closeSheet }
}

function AlbumGridItem({
  item,
  iconSize,
  onPress,
  onLongPress,
}: {
  item: Album
  iconSize: number
  onPress?: () => void
  onLongPress?: () => void
}) {
  const theme = useThemeColors()
  const { t } = useTranslation()

  return (
    <MediaItem variant="grid" className="w-full" onPress={onPress} onLongPress={onLongPress}>
      <MediaItemImage
        icon={
          <LocalVynil02SolidIcon
            fill="none"
            width={iconSize}
            height={iconSize}
            color={theme.muted}
          />
        }
        image={item.image}
        className="aspect-square w-full rounded-md"
      />
      <MediaItemContent className="mt-1">
        <MediaItemTitle className="text-sm" numberOfLines={1}>
          {item.title}
        </MediaItemTitle>
        <MediaItemDescription numberOfLines={1}>
          {mergeText([
            item.albumArtist || item.artist,
            item.trackCount > 0 ? t("library.count.track", { count: item.trackCount }) : null,
          ])}
        </MediaItemDescription>
      </MediaItemContent>
    </MediaItem>
  )
}

export function AlbumGrid({
  data,
  onAlbumPress,
  horizontal = false,
  containerClassName,
  listHeader = null,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  scrollEventThrottle = 16,
  onScroll,
}: AlbumGridProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const { selectedAlbum, isSheetOpen, handleLongPress, closeSheet } = useAlbumActionSheet()

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

  if (horizontal) {
    const renderItem = useCallback(
      ({ item, index }: LegendListRenderItemProps<Album>) => (
        <View key={item.id} style={{ width: 144, marginRight: index === data.length - 1 ? 0 : 16 }}>
          <AlbumGridItem
            item={item}
            iconSize={ICON_SIZES.mediumCardFallback}
            onPress={() => onAlbumPress?.(item)}
            onLongPress={() => handleLongPress(item)}
          />
        </View>
      ),
      [data.length, onAlbumPress, handleLongPress]
    )

    return (
      <>
        <LegendList
          horizontal
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 2, paddingBottom: 6 }}
          style={{ minHeight: HORIZONTAL_ROW_HEIGHT }}
          className={containerClassName}
          recycleItems
          estimatedItemSize={144}
        />
        {sheet}
      </>
    )
  }

  const renderItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<Album>) => (
      <View
        key={item.id}
        style={{
          flex: 1 / 2,
          paddingRight: index % 2 === 0 ? 8 : 0,
          paddingLeft: index % 2 === 1 ? 8 : 0,
          marginBottom: 16,
        }}
      >
        <AlbumGridItem
          item={item}
          iconSize={ICON_SIZES.largeCardFallback}
          onPress={() => onAlbumPress?.(item)}
          onLongPress={() => handleLongPress(item)}
        />
      </View>
    ),
    [onAlbumPress, handleLongPress]
  )

  return (
    <>
      <LegendList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        scrollEventThrottle={scrollEventThrottle}
        onScroll={onScroll as never}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            icon={
              <LocalVynil02SolidIcon fill="none" width={48} height={48} color={theme.muted} />
            }
            title={t("library.empty.albumsTitle")}
            message={t("library.empty.albumsMessage")}
          />
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200, ...contentContainerStyle } as never}
        style={{ flex: 1, minHeight: 1 }}
        className={containerClassName}
        recycleItems
        estimatedItemSize={260}
      />
      {sheet}
    </>
  )
}
