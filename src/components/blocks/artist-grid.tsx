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
import { LEGEND_LIST_GRID_CONFIG } from "@/components/blocks/legend-list-config"
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { EmptyState } from "@/components/ui/empty-state"
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

const GAP = 12
const NUM_COLUMNS = 3
const HORIZONTAL_PADDING = 32

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
  const [selectedArtist, setSelectedArtist] = React.useState<Artist | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const { width: windowWidth } = useWindowDimensions()
  const itemWidth = (windowWidth - HORIZONTAL_PADDING - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
  const estimatedArtistItemHeight = itemWidth + 48
  const gridContentContainerStyle = StyleSheet.flatten([
    { paddingBottom: 8 },
    contentContainerStyle,
  ])
  const handlePress = (artist: Artist) => {
    onArtistPress?.(artist)
  }

  const handleLongPress = (artist: Artist) => {
    setSelectedArtist(artist)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
  }

  const formatTrackCount = (count: number) => t("library.count.track", { count })

  const sheet = (
    <CollectionActionSheet
      visible={isSheetOpen && Boolean(selectedArtist)}
      onOpenChange={(open) => {
        if (!open) {
          closeSheet()
        }
      }}
      type="artist"
      id={selectedArtist?.id ?? ""}
      name={selectedArtist?.name ?? ""}
      subtitle={selectedArtist ? formatTrackCount(selectedArtist.trackCount) : undefined}
      image={selectedArtist?.image}
      trackCount={selectedArtist?.trackCount ?? 0}
    />
  )

  if (data.length === 0) {
    return (
      <EmptyState
        icon={
          <LocalUserSolidIcon
            fill="none"
            width={ICON_SIZES.emptyState}
            height={ICON_SIZES.emptyState}
            color={theme.muted}
          />
        }
        title={t("library.empty.artistsTitle")}
        message={t("library.empty.artistsMessage")}
      />
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <LegendList
        ref={listRef}
        {...listBehaviorProps}
        data={data}
        renderItem={({ item, index }: LegendListRenderItemProps<Artist>) => {
          const column = index % NUM_COLUMNS
          return (
            <Item
              key={item.id}
              variant="grid"
              boundaryId={resolveArtistTransitionId({ id: item.id, name: item.name })}
              style={{
                width: itemWidth,
                marginRight: column < NUM_COLUMNS - 1 ? GAP : 0,
                marginBottom: GAP,
              }}
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item)}
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
          )
        }}
        keyExtractor={(item) => item.id}
        scrollEnabled={scrollEnabled}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={gridContentContainerStyle}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        refreshControl={refreshControl || undefined}
        style={{ flex: 1, minHeight: 1 }}
        {...LEGEND_LIST_GRID_CONFIG}
        estimatedItemSize={estimatedArtistItemHeight}
      />
      {sheet}
    </View>
  )
}
