import * as React from "react"

import { ArtistGrid } from "@/components/blocks/artist-grid"
import { sortArtists } from "@/domains/tracks/detail-sort"
import { useArtists } from "@/domains/artists/queries"

interface ArtistsTabProps {
  onArtistPress?: (artist: { id: string; name: string }) => void
}

export function ArtistsTab({ onArtistPress }: ArtistsTabProps) {
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
  const sortedArtists = React.useMemo(
    () => sortArtists(artists, { field: "name", order: "asc" }),
    [artists]
  )

  return <ArtistGrid data={sortedArtists} onArtistPress={onArtistPress} />
}
