import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { LegendList, type LegendListRenderItemProps } from '@legendapp/list'
import * as React from 'react'
import { Dimensions, View } from 'react-native'

import LocalVynilSolidIcon from '@/components/icons/local/vynil-solid'
import {
  EmptyState,
  Item,
  ItemContent,
  ItemDescription,
  ItemImage,
  ItemTitle,
} from '@/components/ui'
import { ICON_SIZES } from '@/constants/icon-sizes'
import { useThemeColors } from '@/hooks/use-theme-colors'

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
  scrollEnabled?: boolean
  listHeader?: React.ReactElement | null
  listFooter?: React.ReactElement | null
  contentContainerStyle?: StyleProp<ViewStyle>
  showsVerticalScrollIndicator?: boolean
  scrollEventThrottle?: number
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => void
  refreshControl?: React.ReactElement | null
}

const GAP = 16
const NUM_COLUMNS = 2
const SCREEN_WIDTH = Dimensions.get('window').width
const HORIZONTAL_PADDING = 32
const ITEM_WIDTH
  = (SCREEN_WIDTH - HORIZONTAL_PADDING - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

export const AlbumGrid: React.FC<AlbumGridProps> = ({
  data,
  onAlbumPress,
  horizontal,
  containerClassName = '',
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
}) => {
  const theme = useThemeColors()

  const handlePress = (album: Album) => {
    onAlbumPress?.(album)
  }

  const renderAlbumItem = (item: Album) => (
    <Item variant="grid" className="w-full" onPress={() => handlePress(item)}>
      <ItemImage
        icon={(
          <LocalVynilSolidIcon
            fill="none"
            width={ICON_SIZES.largeCardFallback}
            height={ICON_SIZES.largeCardFallback}
            color={theme.muted}
          />
        )}
        image={item.image}
        className="aspect-square w-full rounded-md"
      />
      <ItemContent className="mt-1">
        <ItemTitle className="text-sm normal-case" numberOfLines={1}>
          {item.title}
        </ItemTitle>
        <ItemDescription numberOfLines={1}>
          {item.albumArtist || item.artist}
          {item.trackCount ? ` • ${item.trackCount} tracks` : ''}
        </ItemDescription>
      </ItemContent>
    </Item>
  )

  if (data.length === 0) {
    return (
      <EmptyState
        icon={(
          <LocalVynilSolidIcon
            fill="none"
            width={ICON_SIZES.emptyState}
            height={ICON_SIZES.emptyState}
            color={theme.muted}
          />
        )}
        title="No Albums"
        message="Albums you add to your library will appear here."
      />
    )
  }

  if (horizontal) {
    return (
      <LegendList
        horizontal
        data={data}
        renderItem={({ item, index }: LegendListRenderItemProps<Album>) => (
          <View
            key={item.id}
            className="w-36"
            style={{ marginRight: index === data.length - 1 ? 0 : 16 }}
          >
            <Item variant="grid" onPress={() => handlePress(item)}>
              <ItemImage
                icon={(
                  <LocalVynilSolidIcon
                    fill="none"
                    width={ICON_SIZES.mediumCardFallback}
                    height={ICON_SIZES.mediumCardFallback}
                    color={theme.muted}
                  />
                )}
                image={item.image}
                className="aspect-square w-full rounded-md"
              />
              <ItemContent className="mt-1">
                <ItemTitle className="text-sm normal-case" numberOfLines={1}>
                  {item.title}
                </ItemTitle>
                <ItemDescription numberOfLines={1}>
                  {item.albumArtist || item.artist}
                  {item.trackCount ? ` • ${item.trackCount} tracks` : ''}
                </ItemDescription>
              </ItemContent>
            </Item>
          </View>
        )}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 4 }}
        className={containerClassName}
        recycleItems={true}
        initialContainerPoolRatio={2.5}
        estimatedItemSize={144}
        drawDistance={160}
      />
    )
  }

  return (
    <LegendList
      data={data}
      renderItem={({ item, index }: LegendListRenderItemProps<Album>) => {
        const column = index % NUM_COLUMNS
        return (
          <View
            style={{
              width: ITEM_WIDTH,
              marginRight: column < NUM_COLUMNS - 1 ? GAP : 0,
              marginBottom: GAP,
            }}
          >
            {renderAlbumItem(item)}
          </View>
        )
      }}
      keyExtractor={item => item.id}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={[{ paddingBottom: 8 }, contentContainerStyle]}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      scrollEventThrottle={scrollEventThrottle}
      refreshControl={refreshControl}
      style={{ flex: 1, minHeight: 1 }}
      className={containerClassName}
      recycleItems={true}
      initialContainerPoolRatio={2.5}
      estimatedItemSize={176}
      drawDistance={160}
    />
  )
}
