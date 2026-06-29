/**
 * Purpose: Renders the artist grid for the library tab using stored artist artwork and sort state.
 * Caller: Library tab artist surface.
 * Dependencies: Artists query hook, artist grid UI, sort store, theme colors, and localization.
 * Main Functions: ArtistsTab()
 * Side Effects: None.
 */

import type { RefreshControlProps } from "react-native"
import type { SortConfig } from "@/modules/library/sort-types"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { type Artist, ArtistGrid } from "@/components/blocks/artist-grid"
import { LibraryTab } from "@/components/ui/library-tab"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { sortArtists } from "@/modules/library/sort-utils"
import { useArtists } from "@/modules/library/queries"
import { useThemeColors } from "@/modules/ui/theme"
import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"

type ArtistOrderByField = Parameters<typeof useArtists>[0]
type ArtistOrder = Parameters<typeof useArtists>[1]

function getArtistOrderByField(field: SortConfig["field"]): ArtistOrderByField {
  switch (field) {
    case "trackCount":
    case "dateAdded":
    case "name":
      return field
    default:
      return "name"
  }
}

interface ArtistsTabProps {
  onArtistPress?: (artist: Artist) => void
  onArtistLongPress?: (artist: Artist) => void
  sortConfig?: SortConfig
  contentBottomPadding?: number
  refreshControl?: React.ReactElement<RefreshControlProps> | null
}

export const ArtistsTab: React.FC<ArtistsTabProps> = ({
  onArtistPress,
  onArtistLongPress,
  sortConfig,
  contentBottomPadding = 0,
  refreshControl,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const autoHideScrollProps = useAutoHideHeaderScroll()
  const effectiveSortConfig = React.useMemo<SortConfig>(
    () =>
      sortConfig ?? {
        field: "name",
        order: "asc",
      },
    [sortConfig]
  )
  const orderByField = getArtistOrderByField(effectiveSortConfig.field)
  const order: ArtistOrder = effectiveSortConfig.order

  const { data: artistsData } = useArtists(orderByField, order)

  const artists = React.useMemo<Artist[]>(
    () =>
      (artistsData || []).map((artist) => ({
        id: artist.id,
        name: artist.name,
        trackCount: artist.trackCount || 0,
        image: artist.artwork || undefined,
        dateAdded: 0,
      })),
    [artistsData]
  )
  const sortedArtists = React.useMemo(
    () => sortArtists(artists, effectiveSortConfig),
    [artists, effectiveSortConfig]
  )

  const handleArtistPress = React.useCallback(
    (artist: Artist) => {
      onArtistPress?.(artist)
    },
    [onArtistPress]
  )

  return (
    <LibraryTab
      hasData={artists.length > 0}
      emptyIcon={<LocalUserSolidIcon fill="none" width={48} height={48} color={theme.muted} />}
      emptyTitle={t("library.empty.artistsTitle")}
      emptyMessage={t("library.empty.artistsMessage")}
      contentBottomPadding={contentBottomPadding}
      resetScrollKey={`${effectiveSortConfig.field}-${effectiveSortConfig.order}`}
      refreshControl={refreshControl}
      autoHideScrollProps={autoHideScrollProps}
    >
      <ArtistGrid
        data={sortedArtists}
        onArtistPress={handleArtistPress}
        onArtistLongPress={onArtistLongPress}
      />
    </LibraryTab>
  )
}
