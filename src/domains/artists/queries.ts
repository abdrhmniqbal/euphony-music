import { eq } from "drizzle-orm"
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
