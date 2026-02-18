import * as React from "react"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list"
import { Dimensions } from "react-native"

import { ICON_SIZES } from "@/constants/icon-sizes"
import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import {
  EmptyState,
  Item,
  ItemContent,
  ItemDescription,
  ItemImage,
  ItemTitle,
} from "@/components/ui"

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
  scrollEnabled?: boolean
}

const GAP = 12
const NUM_COLUMNS = 3
const SCREEN_WIDTH = Dimensions.get("window").width
const HORIZONTAL_PADDING = 32
const ITEM_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS

export const ArtistGrid: React.FC<ArtistGridProps> = ({
  data,
  onArtistPress,
  scrollEnabled = true,
}) => {
  const theme = useThemeColors()

  const handlePress = (artist: Artist) => {
    onArtistPress?.(artist)
  }

  const formatTrackCount = (count: number) =>
    `${count} ${count === 1 ? "track" : "tracks"}`

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
        title="No Artists"
        message="Artists from your music library will appear here."
      />
    )
  }

  return (
    <LegendList
      data={data}
      renderItem={({ item, index }: LegendListRenderItemProps<Artist>) => {
        const column = index % NUM_COLUMNS
        return (
          <Item
            key={item.id}
            variant="grid"
            style={{
              width: ITEM_WIDTH,
              marginRight: column < NUM_COLUMNS - 1 ? GAP : 0,
              marginBottom: GAP,
            }}
            onPress={() => handlePress(item)}
          >
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
            <ItemContent className="mt-1 items-center">
              <ItemTitle
                className="text-center text-sm normal-case"
                numberOfLines={1}
              >
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
      contentContainerStyle={{ paddingBottom: 8 }}
      style={{ flex: 1, minHeight: 1 }}
      recycleItems={true}
      initialContainerPoolRatio={2.5}
      estimatedItemSize={132}
      drawDistance={160}
    />
  )
}
