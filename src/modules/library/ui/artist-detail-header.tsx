import { Text, View } from "react-native"
import { Button } from "heroui-native"
import { BackButton } from "@/components/patterns/back-button"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import { cn } from "@/utils/common"

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
}: ArtistDetailHeaderProps) {
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
        className={cn("-ml-2", !isHeaderSolid && "bg-overlay/30")}
        fallbackHref="/(main)/(library)"
        iconColor={isHeaderSolid ? foregroundColor : "white"}
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
        <Button
          onPress={onToggleFavorite}
          isDisabled={isFavoritePending}
          variant="ghost"
          className={cn("-mr-2", !isHeaderSolid && "bg-overlay/30")}
          isIconOnly
        >
          {isArtistFavorite ? (
            <LocalFavouriteSolidIcon fill="none" width={24} height={24} color="#ef4444" />
          ) : (
            <LocalFavouriteIcon
              fill="none"
              width={24}
              height={24}
              color={isHeaderSolid ? foregroundColor : "white"}
            />
          )}
        </Button>
      ) : (
        <View className="h-10 w-10" />
      )}
    </View>
  )
}
