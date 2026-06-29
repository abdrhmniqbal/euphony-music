import type { FavoriteEntry } from "@/modules/favorites/types"
import { Image } from "expo-image"
import { View } from "react-native"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import { MediaItemImage as ItemImage } from "@/components/ui/media-item"
import { ICON_SIZES } from "@/constants/icon-sizes"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { useThemeColors } from "@/modules/ui/theme"

export const FavoriteItemImage: React.FC<{ favorite: FavoriteEntry }> = ({ favorite }) => {
  const theme = useThemeColors()

  switch (favorite.type) {
    case "artist":
      return (
        <ItemImage className="overflow-hidden rounded-full">
          {favorite.image ? (
            <Image
              source={{ uri: favorite.image }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center rounded-full bg-surface">
              <LocalUserSolidIcon
                fill="none"
                width={ICON_SIZES.listFallback}
                height={ICON_SIZES.listFallback}
                color={theme.muted}
              />
            </View>
          )}
        </ItemImage>
      )

    case "playlist":
      return (
        <ItemImage className="items-center justify-center overflow-hidden bg-default">
          <PlaylistArtwork images={resolvePlaylistArtworkImages(favorite.images, favorite.image)} />
        </ItemImage>
      )

    case "album":
      return (
        <ItemImage
          icon={
            <LocalVynil02SolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={theme.muted}
            />
          }
          image={favorite.image}
          className="rounded-lg"
        />
      )

    case "track":
    default:
      return (
        <ItemImage
          icon={
            <LocalMusicNote04SolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={theme.muted}
            />
          }
          image={favorite.image}
        />
      )
  }
}
