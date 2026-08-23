import { albums } from "@/core/db/schema"
import { useQuery } from "@tanstack/react-query"

import { db } from "@/core/db"
import { ALBUMS_KEY } from "@/domains/library/query-keys"

export interface AlbumRecord {
  id: string
  title: string
  artwork: string | null
  year: number | null
  dateAdded: number | null
  trackCount: number | null
  artistName: string | null
}

export function useAlbums() {
  return useQuery<AlbumRecord[]>({
    queryKey: [ALBUMS_KEY],
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const rows = await db.query.albums.findMany({
        with: { artist: true },
      })
      return rows
        .filter((row) => row.trackCount === null || row.trackCount > 0)
        .map((row) => ({
          id: row.id,
          title: row.title,
          artwork: row.artwork,
          year: row.year,
          dateAdded: row.createdAt,
          trackCount: row.trackCount,
          artistName: row.artist?.name ?? null,
        }))
    },
  })
}
