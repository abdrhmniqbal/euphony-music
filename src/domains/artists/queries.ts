import { eq, gt } from "drizzle-orm"
import { useQuery } from "@tanstack/react-query"

import { db } from "@/core/db"
import { artists } from "@/core/db/schema"
import { ARTISTS_KEY } from "@/domains/library/query-keys"

export interface ArtistRecord {
  id: string
  name: string
  artwork: string | null
  bio: string | null
}

async function getArtistByName(name: string): Promise<ArtistRecord | null> {
  const row = await db.query.artists.findFirst({
    where: eq(artists.name, name),
    columns: { id: true, name: true, artwork: true, bio: true },
  })
  return row ?? null
}

export function useArtistByName(name: string) {
  const normalizedName = name.trim()

  return useQuery<ArtistRecord | null>({
    queryKey: [ARTISTS_KEY, "by-name", normalizedName],
    enabled: normalizedName.length > 0,
    placeholderData: (previousData) => previousData,
    queryFn: () => getArtistByName(normalizedName),
  })
}

export interface ArtistListItem {
  id: string
  name: string
  artwork: string | null
  trackCount: number
}

export function useArtists() {
  return useQuery<ArtistListItem[]>({
    queryKey: [ARTISTS_KEY],
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const rows = await db.query.artists.findMany({
        where: gt(artists.trackCount, 0),
        columns: { id: true, name: true, artwork: true, trackCount: true },
        orderBy: (table, { asc }) => asc(table.name),
      })
      return rows.map((row) => ({ ...row, trackCount: row.trackCount ?? 0 }))
    },
  })
}
