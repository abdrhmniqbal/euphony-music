/**
 * Purpose: Renders one search result row for artists, albums, playlists, or tracks.
 * Caller: SearchResults list renderer.
 * Dependencies: Media item UI, transition IDs, playlist artwork, theme colors, localization.
 * Main Functions: SearchResultRow(), MemoizedSearchResultRow
 * Side Effects: Calls parent press handlers for navigation, recent-search updates, or playback.
 */

import type {
  SearchAlbumResult,
  SearchArtistResult,
  SearchPlaylistResult,
} from "@/modules/library/types"
import type { Track } from "@/modules/player/store"
import * as React from "react"
import { useTranslation } from "react-i18next"
import { Text } from "react-native"
import Transition from "react-native-screen-transitions"

import LocalCheckmarkCircleSolidIcon from "@/components/icons/local/checkmark-circle-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import {
  MediaItem as Item,
  MediaItemAction as ItemAction,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { ICON_SIZES } from "@/constants/icon-sizes"
import {
  resolveAlbumTransitionId,
  resolveArtistTransitionId,
  resolvePlaylistTransitionId,
} from "@/modules/artists/artist-transition"
import { useThemeColors } from "@/modules/ui/theme"

export type SearchResultEntityItem =
  | { id: string; type: "artist"; artist: SearchArtistResult }
  | { id: string; type: "album"; album: SearchAlbumResult }
  | { id: string; type: "playlist"; playlist: SearchPlaylistResult }
  | { id: string; type: "track"; track: Track }

interface SearchResultRowProps {
  item: SearchResultEntityItem
  onArtistPress?: (artist: SearchArtistResult) => void
  onArtistLongPress?: (artist: SearchArtistResult) => void
  onAlbumPress?: (album: SearchAlbumResult) => void
  onAlbumLongPress?: (album: SearchAlbumResult) => void
  onPlaylistPress?: (playlist: SearchPlaylistResult) => void
  onPlaylistLongPress?: (playlist: SearchPlaylistResult) => void
  onTrackPress?: (track: Track) => void
  onTrackLongPress?: (track: Track) => void
}

function SearchResultRow({
  item,
  onArtistPress,
  onArtistLongPress,
  onAlbumPress,
  onAlbumLongPress,
  onPlaylistPress,
  onPlaylistLongPress,
  onTrackPress,
  onTrackLongPress,
}: SearchResultRowProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()

  if (item.type === "artist") {
    return (
      <Item
        variant="list"
        className="py-1"
        boundaryId={resolveArtistTransitionId({
          id: item.artist.id,
          name: item.artist.name,
        })}
        onPress={() => onArtistPress?.(item.artist)}
        onLongPress={() => onArtistLongPress?.(item.artist)}
      >
        <Transition.Boundary.Target>
          <ItemImage
            icon={
              <LocalUserSolidIcon
                fill="none"
                width={ICON_SIZES.listFallback}
                height={ICON_SIZES.listFallback}
                color={theme.muted}
              />
            }
            image={item.artist.image}
            className="h-14 w-14 rounded-full bg-default"
          />
        </Transition.Boundary.Target>
        <ItemContent>
          <ItemTitle className="text-lg">{item.artist.name}</ItemTitle>
          <Text className="text-xs text-muted">{item.artist.type}</Text>
        </ItemContent>
      </Item>
    )
  }

  if (item.type === "album") {
    return (
      <Item
        boundaryId={resolveAlbumTransitionId({
          id: item.album.id,
          title: item.album.title,
        })}
        onPress={() => onAlbumPress?.(item.album)}
        onLongPress={() => onAlbumLongPress?.(item.album)}
      >
        <Transition.Boundary.Target>
          <ItemImage
            icon={
              <LocalVynilSolidIcon
                fill="none"
                width={ICON_SIZES.listFallback}
                height={ICON_SIZES.listFallback}
                color={theme.muted}
              />
            }
            image={item.album.image}
            className="rounded-md"
          />
        </Transition.Boundary.Target>
        <ItemContent>
          <ItemTitle>{item.album.title || t("library.unknownAlbum")}</ItemTitle>
          <ItemDescription>{item.album.artist || t("library.unknownArtist")}</ItemDescription>
        </ItemContent>
        {item.album.isVerified && (
          <ItemAction>
            <LocalCheckmarkCircleSolidIcon
              fill="none"
              width={20}
              height={20}
              color={theme.accent}
            />
          </ItemAction>
        )}
      </Item>
    )
  }

  if (item.type === "playlist") {
    return (
      <Item
        boundaryId={resolvePlaylistTransitionId({
          id: item.playlist.id,
          title: item.playlist.title,
        })}
        onPress={() => onPlaylistPress?.(item.playlist)}
        onLongPress={() => onPlaylistLongPress?.(item.playlist)}
      >
        <Transition.Boundary.Target>
          <ItemImage className="items-center justify-center overflow-hidden bg-default">
            <PlaylistArtwork
              images={resolvePlaylistArtworkImages(item.playlist.images, item.playlist.image)}
            />
          </ItemImage>
        </Transition.Boundary.Target>
        <ItemContent>
          <ItemTitle>{item.playlist.title}</ItemTitle>
          <ItemDescription>
            {t("library.count.track", {
              count: item.playlist.trackCount,
            })}
          </ItemDescription>
        </ItemContent>
      </Item>
    )
  }

  return (
    <Item
      onPress={() => {
        onTrackPress?.(item.track)
      }}
      onLongPress={() => onTrackLongPress?.(item.track)}
    >
      <ItemImage
        icon={
          <LocalMusicNoteSolidIcon
            fill="none"
            width={ICON_SIZES.listFallback}
            height={ICON_SIZES.listFallback}
            color={theme.muted}
          />
        }
        image={item.track.image}
        className="rounded-md"
      />
      <ItemContent>
        <ItemTitle>{item.track.title}</ItemTitle>
        <ItemDescription>{item.track.artist || t("library.unknownArtist")}</ItemDescription>
      </ItemContent>
    </Item>
  )
}

export const MemoizedSearchResultRow = React.memo(SearchResultRow)
