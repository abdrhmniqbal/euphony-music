import * as React from "react"
import { useTranslation } from "react-i18next"
import { useThemeColor } from "heroui-native"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import {
  MediaItem,
  MediaItemContent,
  MediaItemDescription,
  MediaItemImage,
  MediaItemTitle,
} from "@/components/ui/media-item"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import { ICON_SIZES } from "@/lib/layout"
import type { PlayerTrack } from "@/playback/types"
import type {
  SearchAlbumResult,
  SearchArtistResult,
  SearchPlaylistResult,
} from "@/domains/search/types"

export type SearchResultEntityItem =
  | { id: string; type: "artist"; artist: SearchArtistResult }
  | { id: string; type: "album"; album: SearchAlbumResult }
  | { id: string; type: "playlist"; playlist: SearchPlaylistResult }
  | { id: string; type: "track"; track: PlayerTrack }

interface SearchResultRowProps {
  item: SearchResultEntityItem
  onPress?: (item: SearchResultEntityItem) => void
  onLongPress?: (item: SearchResultEntityItem) => void
}

function SearchResultRow({ item, onPress, onLongPress }: SearchResultRowProps) {
  const muted = useThemeColor("muted")
  const { t } = useTranslation()

  if (item.type === "artist") {
    return (
      <MediaItem
        className="py-1"
        onPress={() => onPress?.(item)}
        onLongPress={() => onLongPress?.(item)}
      >
        <MediaItemImage
          className="h-14 w-14 overflow-hidden rounded-full"
          icon={
            <LocalUserSolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={muted}
            />
          }
          image={item.artist.image}
        />
        <MediaItemContent>
          <MediaItemTitle className="text-lg">{item.artist.name}</MediaItemTitle>
          <MediaItemDescription>{t("library.favoriteType.artist")}</MediaItemDescription>
        </MediaItemContent>
      </MediaItem>
    )
  }

  if (item.type === "album") {
    return (
      <MediaItem onPress={() => onPress?.(item)} onLongPress={() => onLongPress?.(item)}>
        <MediaItemImage
          icon={
            <LocalVynil02SolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={muted}
            />
          }
          image={item.album.image}
          className="rounded-md"
        />
        <MediaItemContent>
          <MediaItemTitle>{item.album.title || t("library.unknownAlbum")}</MediaItemTitle>
          <MediaItemDescription>
            {item.album.artist || t("library.unknownArtist")}
          </MediaItemDescription>
        </MediaItemContent>
      </MediaItem>
    )
  }

  if (item.type === "playlist") {
    return (
      <MediaItem onPress={() => onPress?.(item)} onLongPress={() => onLongPress?.(item)}>
        <MediaItemImage className="items-center justify-center overflow-hidden bg-default">
          <PlaylistArtwork
            images={resolvePlaylistArtworkImages(item.playlist.images, item.playlist.image)}
          />
        </MediaItemImage>
        <MediaItemContent>
          <MediaItemTitle>{item.playlist.title}</MediaItemTitle>
          <MediaItemDescription>
            {t("library.count.track", { count: item.playlist.trackCount })}
          </MediaItemDescription>
        </MediaItemContent>
      </MediaItem>
    )
  }

  return (
    <MediaItem onPress={() => onPress?.(item)} onLongPress={() => onLongPress?.(item)}>
      <MediaItemImage
        icon={
          <LocalMusicNote04SolidIcon
            fill="none"
            width={ICON_SIZES.listFallback}
            height={ICON_SIZES.listFallback}
            color={muted}
          />
        }
        image={item.track.image}
        className="rounded-md"
      />
      <MediaItemContent>
        <MediaItemTitle>{item.track.title}</MediaItemTitle>
        <MediaItemDescription>
          {item.track.artist || t("library.unknownArtist")}
        </MediaItemDescription>
      </MediaItemContent>
    </MediaItem>
  )
}

export const MemoizedSearchResultRow = React.memo(SearchResultRow)
