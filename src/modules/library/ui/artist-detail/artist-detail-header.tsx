import { Text, View } from "react-native"
import { Button } from "heroui-native"
import { BackButton } from "@/components/patterns/back-button"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import LocalMoreHorizontalCircle01SolidIcon from "@/components/icons/local/more-horizontal-circle-01-solid"
import { cn } from "@/utils/common"
import { useThemeColors } from "@/modules/ui/theme"

interface ArtistDetailHeaderProps {
  topInset: number
  isHeaderSolid: boolean
  backgroundColor: string
  foregroundColor: string
  artistName: string
  artistId?: string
  isArtistFavorite: boolean
  isFavoritePending: boolean
  onBack: () => void
  onToggleFavorite: () => void
  onOpenActions: () => void
}

export function ArtistDetailHeader({
  topInset,
  isHeaderSolid,
  backgroundColor,
  foregroundColor,
  artistName,
  artistId,
  isArtistFavorite,
  isFavoritePending,
  onBack,
  onToggleFavorite,
  onOpenActions,
}: ArtistDetailHeaderProps) {
  const theme = useThemeColors()

  return (
    <View
      className="absolute right-0 left-0 flex-row items-end justify-between px-4 pb-2"
      style={{
        top: 0,
        height: topInset + 52,
        zIndex: 100,
        elevation: 100,
        backgroundColor: isHeaderSolid ? backgroundColor : "transparent",
      }}
    >
      <BackButton
        className={cn("-ml-2", !isHeaderSolid && "rounded-full bg-black/35")}
        fallbackHref="/(main)/(library)"
        iconColor={isHeaderSolid ? foregroundColor : "#ffffff"}
        onPress={onBack}
      />
      {isHeaderSolid ? (
        <View pointerEvents="none" className="absolute right-16 bottom-4 left-16 items-center">
          <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
            {artistName}
          </Text>
        </View>
      ) : null}
      {artistId ? (
        <View className="flex-row gap-4">
          <Button
            onPress={onToggleFavorite}
            isDisabled={isFavoritePending}
            variant="ghost"
            className={cn("-mr-2", !isHeaderSolid && "rounded-full bg-black/35")}
            isIconOnly
          >
            {isArtistFavorite ? (
              <LocalFavouriteSolidIcon fill="none" width={24} height={24} color={theme.danger} />
            ) : (
              <LocalFavouriteIcon
                fill="none"
                width={24}
                height={24}
                color={isHeaderSolid ? foregroundColor : "#ffffff"}
              />
            )}
          </Button>
          <Button
            onPress={onOpenActions}
            variant="ghost"
            className={cn("-mr-2", !isHeaderSolid && "rounded-full bg-black/35")}
            isIconOnly
          >
            <LocalMoreHorizontalCircle01SolidIcon
              fill="none"
              width={24}
              height={24}
              color={isHeaderSolid ? foregroundColor : "#ffffff"}
            />
          </Button>
        </View>
      ) : (
        <View className="h-10 w-10" />
      )}
    </View>
  )
}
