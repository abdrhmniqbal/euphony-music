import type { RefreshControlProps } from "react-native"
import type { SortConfig } from "@/modules/library/sort-types"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { type Album, AlbumGrid } from "@/components/blocks/album-grid"
import { LibraryTabState } from "@/components/blocks/library-tab-state"
import LocalVynil02SolidIcon from "@/components/icons/local/vynil-02-solid"
import { sortAlbums } from "@/modules/library/sort-utils"
import { useAlbums } from "@/modules/library/queries"
import { useThemeColors } from "@/modules/ui/theme"

import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"

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
  onAlbumLongPress?: (album: Album) => void
  sortConfig?: SortConfig
  contentBottomPadding?: number
  refreshControl?: React.ReactElement<RefreshControlProps> | null
}

export const AlbumsTab: React.FC<AlbumsTabProps> = ({
  onAlbumPress,
  onAlbumLongPress,
  sortConfig,
  contentBottomPadding = 0,
  refreshControl,
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

  const autoHideScrollProps = useAutoHideHeaderScroll()

  const handleAlbumPress = React.useCallback(
    (album: Album) => {
      onAlbumPress?.(album)
    },
    [onAlbumPress]
  )

  return (
    <LibraryTabState
      hasData={albums.length > 0}
      emptyIcon={<LocalVynil02SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
      emptyTitle={t("library.empty.albumsTitle")}
      emptyMessage={t("library.empty.albumsMessage")}
    >
      <AlbumGrid
        data={sortedAlbums}
        onAlbumPress={handleAlbumPress}
        onAlbumLongPress={onAlbumLongPress}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        resetScrollKey={`${effectiveSortConfig.field}-${effectiveSortConfig.order}`}
        refreshControl={refreshControl}
        {...autoHideScrollProps}
      />
    </LibraryTabState>
  )
}
