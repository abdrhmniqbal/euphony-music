import * as React from "react"

import { AlbumGrid } from "@/components/blocks/album-grid"
import { sortAlbums } from "@/domains/tracks/detail-sort"
import { useAlbums } from "@/domains/albums/queries"
import { useLibrarySortStore } from "@/domains/library/sort-store"
import { useTranslation } from "react-i18next"

interface AlbumsTabProps {
  onAlbumPress?: (album: { id?: string; title: string }) => void
}

export function AlbumsTab({ onAlbumPress }: AlbumsTabProps) {
  const { t } = useTranslation()
  const allSortConfigs = useLibrarySortStore((state) => state.sortConfig)
  const { data: albumsData } = useAlbums()

  const albums = React.useMemo(
    () =>
      (albumsData ?? []).map((album) => ({
        id: album.id,
        title: album.title,
        artist: album.artistName || t("library.unknownArtist"),
        albumArtist: album.artistName ?? undefined,
        image: album.artwork ?? undefined,
        trackCount: album.trackCount ?? 0,
        year: album.year ?? 0,
        dateAdded: 0,
      })),
    [albumsData, t]
  )
  const sortedAlbums = React.useMemo(
    () => sortAlbums(albums, allSortConfigs.AlbumsTab ?? { field: "title", order: "asc" }),
    [albums, allSortConfigs.AlbumsTab]
  )

  return <AlbumGrid data={sortedAlbums} onAlbumPress={onAlbumPress} />
}
