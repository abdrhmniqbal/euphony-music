import * as React from "react"

import { useThemeColors } from "@/hooks/use-theme-colors"
import type { SortConfig } from "@/modules/library/library-sort.store"
import { useArtists } from "@/modules/library/library.queries"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import { ArtistGrid, type Artist } from "@/components/blocks/artist-grid"
import { LibrarySkeleton } from "@/components/blocks/library-skeleton"
import { EmptyState } from "@/components/ui"

interface ArtistsTabProps {
  onArtistPress?: (artist: Artist) => void
  sortConfig?: SortConfig
  contentBottomPadding?: number
}

export const ArtistsTab: React.FC<ArtistsTabProps> = ({
  onArtistPress,
  sortConfig,
  contentBottomPadding = 0,
}) => {
  const theme = useThemeColors()
  const orderByField = sortConfig?.field || "name"
  const order = sortConfig?.order || "asc"

  const {
    data: artistsData,
    isLoading,
    isPending,
  } = useArtists(orderByField as any, order)

  const artists: Artist[] =
    artistsData?.map((artist) => ({
      id: artist.id,
      name: artist.name,
      trackCount: artist.trackCount || 0,
      image: artist.artwork || artist.albumArtwork || undefined,
      dateAdded: 0,
    })) || []

  const handleArtistPress = (artist: Artist) => {
    onArtistPress?.(artist)
  }

  if (isLoading || isPending) {
    return <LibrarySkeleton type="artists" />
  }

  if (artists.length === 0) {
    return (
      <EmptyState
        icon={
          <LocalUserSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        title="No Artists"
        message="Artists from your music library will appear here."
      />
    )
  }

  return (
    <ArtistGrid
      data={artists}
      onArtistPress={handleArtistPress}
      contentContainerStyle={{ paddingBottom: contentBottomPadding }}
      resetScrollKey={`${orderByField}-${order}`}
    />
  )
}
