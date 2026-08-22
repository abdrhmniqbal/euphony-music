import type { FavoriteEntry } from "@/modules/favorites/types"
import * as React from "react"
import { useCallback } from "react"
import { View } from "react-native"
import { PressableFeedback } from "heroui-native"
import LocalFavouriteSolidIcon from "@/modules/shared/components/icons/local/favourite-solid"
import {
  MediaItem as Item,
  MediaItemAction as ItemAction,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemTitle as ItemTitle,
} from "@/modules/shared/components/ui/media-item"
import { useThemeColors } from "@/modules/ui/theme"
import { FavoriteItemImage } from "./favorites-item-image"
import { TypeBadge } from "./favorites-type-badge"

interface FavoriteRowProps {
  favorite: FavoriteEntry
  onPress: (favorite: FavoriteEntry) => void
  onLongPress: (favorite: FavoriteEntry) => void
  onRemove: (favorite: FavoriteEntry) => void
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

export const MemoizedFavoriteRow = React.memo(FavoriteRow)
