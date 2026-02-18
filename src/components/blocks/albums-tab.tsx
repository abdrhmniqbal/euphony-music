import * as React from "react"

import { useThemeColors } from "@/hooks/use-theme-colors"
import type { SortConfig } from "@/modules/library/library-sort.store"
import { useAlbums } from "@/modules/library/library.queries"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import { AlbumGrid, type Album } from "@/components/blocks/album-grid"
import { LibrarySkeleton } from "@/components/blocks/library-skeleton"
import { EmptyState } from "@/components/ui"

interface AlbumsTabProps {
  onAlbumPress?: (album: Album) => void
  sortConfig?: SortConfig
  contentBottomPadding?: number
}

export const AlbumsTab: React.FC<AlbumsTabProps> = ({
  onAlbumPress,
  sortConfig,
  contentBottomPadding = 0,
}) => {
  const theme = useThemeColors()
  const orderByField =
    sortConfig?.field === "artist" ? "title" : sortConfig?.field || "title"
  const order = sortConfig?.order || "asc"

  const {
    data: albumsData,
    isLoading,
    isPending,
  } = useAlbums(orderByField as any, order)

  const albums: Album[] =
    albumsData?.map((album) => ({
      id: album.id,
      title: album.title,
      artist: album.artist?.name || "Unknown Artist",
      albumArtist: album.artist?.name,
      image: album.artwork || undefined,
      trackCount: album.trackCount || 0,
      year: album.year || 0,
      dateAdded: 0,
    })) || []

  const handleAlbumPress = (album: Album) => {
    onAlbumPress?.(album)
  }

  if (isLoading || isPending) {
    return <LibrarySkeleton type="albums" />
  }

  if (albums.length === 0) {
    return (
      <EmptyState
        icon={
          <LocalVynilSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        title="No Albums"
        message="Albums you add to your library will appear here."
      />
    )
  }

  return (
    <AlbumGrid
      data={albums}
      onAlbumPress={handleAlbumPress}
      contentContainerStyle={{ paddingBottom: contentBottomPadding }}
      resetScrollKey={`${orderByField}-${order}`}
    />
  )
}
