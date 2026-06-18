import type { NativeScrollEvent, NativeSyntheticEvent, RefreshControlProps } from "react-native"
import type { SortConfig } from "@/modules/library/sort-types"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { type Album, AlbumGrid } from "@/components/blocks/album-grid"
import { LibraryTabState } from "@/components/blocks/library-tab-state"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import { sortAlbums } from "@/modules/library/sort-utils"
import { useAlbums } from "@/modules/library/queries"
import { useThemeColors } from "@/modules/ui/theme"

type AlbumOrderByField = Parameters<typeof useAlbums>[0]
type AlbumOrder = Parameters<typeof useAlbums>[1]

function getAlbumOrderByField(field: SortConfig["field"]): AlbumOrderByField {
  switch (field) {
    case "year":
    case "trackCount":
    case "dateAdded":
    case "title":
      return field
    case "artist":
    default:
      return "title"
  }
}

interface AlbumsTabProps {
  onAlbumPress?: (album: Album) => void
  sortConfig?: SortConfig
  contentBottomPadding?: number
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

export const AlbumsTab: React.FC<AlbumsTabProps> = ({
  onAlbumPress,
  sortConfig,
  contentBottomPadding = 0,
  refreshControl,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const effectiveSortConfig = React.useMemo<SortConfig>(
    () =>
      sortConfig ?? {
        field: "title",
        order: "asc",
      },
    [sortConfig]
  )
  const orderByField = getAlbumOrderByField(effectiveSortConfig.field)
  const order: AlbumOrder = effectiveSortConfig.order

  const { data: albumsData } = useAlbums(orderByField, order)

  const albums = React.useMemo<Album[]>(
    () =>
      (albumsData || []).map((album) => ({
        id: album.id,
        title: album.title,
        artist: album.artist?.name || t("library.unknownArtist"),
        albumArtist: album.artist?.name,
        image: album.artwork || undefined,
        trackCount: album.trackCount || 0,
        year: album.year || 0,
        dateAdded: 0,
      })),
    [albumsData, t]
  )
  const sortedAlbums = React.useMemo(
    () => sortAlbums(albums, effectiveSortConfig),
    [albums, effectiveSortConfig]
  )

  const handleAlbumPress = React.useCallback(
    (album: Album) => {
      onAlbumPress?.(album)
    },
    [onAlbumPress]
  )

  return (
    <LibraryTabState
      hasData={albums.length > 0}
      emptyIcon={<LocalVynilSolidIcon fill="none" width={48} height={48} color={theme.muted} />}
      emptyTitle={t("library.empty.albumsTitle")}
      emptyMessage={t("library.empty.albumsMessage")}
    >
      <AlbumGrid
        data={sortedAlbums}
        onAlbumPress={handleAlbumPress}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        resetScrollKey={`${effectiveSortConfig.field}-${effectiveSortConfig.order}`}
        refreshControl={refreshControl}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
    </LibraryTabState>
  )
}
