import * as React from "react"

import { ArtistGrid } from "@/components/blocks/artist-grid"
import { LibraryListHeader } from "@/components/blocks/library-list-header"
import { SortSheet } from "@/components/blocks/sort-sheet"
import { NAME_TRACK_COUNT_SORT_OPTIONS, resolveSortLabel } from "@/domains/library/sort-constants"
import { setSortConfig, useLibrarySortStore } from "@/domains/library/sort-store"
import { sortArtists } from "@/domains/tracks/detail-sort"
import { useArtists } from "@/domains/artists/queries"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

interface ArtistsTabProps {
  onArtistPress?: (artist: { id: string; name: string }) => void
}

export function ArtistsTab({ onArtistPress }: ArtistsTabProps) {
  const { t } = useTranslation()
  const [showSortSheet, setShowSortSheet] = React.useState(false)
  const sortConfig = useLibrarySortStore((state) => state.sortConfig.ArtistsTab)
  const { data: artistsData } = useArtists()

  const artists = React.useMemo(
    () =>
      (artistsData ?? []).map((artist) => ({
        id: artist.id,
        name: artist.name,
        trackCount: artist.trackCount,
        image: artist.artwork ?? undefined,
      })),
    [artistsData]
  )
  const sortedArtists = React.useMemo(() => sortArtists(artists, sortConfig), [artists, sortConfig])

  return (
    <SortSheet
      visible={showSortSheet}
      onOpenChange={setShowSortSheet}
      currentField={sortConfig.field}
      currentOrder={sortConfig.order}
      onSelect={(field, order) => setSortConfig("ArtistsTab", field, order)}
    >
      <View className="flex-1">
        {sortedArtists.length > 0 ? (
          <LibraryListHeader
            count={sortedArtists.length}
            className="px-4 pt-4"
            sortLabel={t(
              resolveSortLabel(NAME_TRACK_COUNT_SORT_OPTIONS, sortConfig.field) || "library.sortBy"
            )}
          />
        ) : null}
        <ArtistGrid data={sortedArtists} onArtistPress={onArtistPress} />
      </View>
      <SortSheet.Content options={NAME_TRACK_COUNT_SORT_OPTIONS} />
    </SortSheet>
  )
}
