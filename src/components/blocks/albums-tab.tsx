import * as React from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { AlbumGrid } from "@/components/blocks/album-grid"
import { LibraryListHeader } from "@/components/blocks/library-list-header"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { ALBUM_SORT_OPTIONS, resolveSortLabel } from "@/domains/library/sort-constants"
import { setSortConfig, useLibrarySortStore } from "@/domains/library/sort-store"
import { sortAlbums } from "@/domains/tracks/detail-sort"
import { useAlbums } from "@/domains/albums/queries"

interface AlbumsTabProps {
  onAlbumPress?: (album: { id?: string; title: string }) => void
}

export function AlbumsTab({ onAlbumPress }: AlbumsTabProps) {
  const { t } = useTranslation()
  const [showSortSheet, setShowSortSheet] = React.useState(false)
  const sortConfig = useLibrarySortStore((state) => state.sortConfig.AlbumsTab)
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
  const sortedAlbums = React.useMemo(() => sortAlbums(albums, sortConfig), [albums, sortConfig])

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={(field, order) => setSortConfig("AlbumsTab", field, order)}
    >
      <View className="flex-1">
        {sortedAlbums.length > 0 ? (
          <LibraryListHeader
            count={sortedAlbums.length}
            className="px-4 pt-4"
            sortLabel={t(
              resolveSortLabel(ALBUM_SORT_OPTIONS, sortConfig.field) || "library.sortBy"
            )}
          />
        ) : null}
        <AlbumGrid data={sortedAlbums} onAlbumPress={onAlbumPress} />
      </View>
      <SortSheet.Content options={ALBUM_SORT_OPTIONS} />
    </SortSheet>
  )
}
