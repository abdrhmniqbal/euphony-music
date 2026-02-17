import { useQuery } from "@tanstack/react-query"
import { asc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { genres } from "@/db/schema"

const GENRES_KEY = "genres"

export function useGenres() {
  return useQuery({
    queryKey: [GENRES_KEY],
    queryFn: async () => {
      return db.query.genres.findMany({
        orderBy: [asc(genres.name)],
      })
    },
  })
}

export function useGenre(id: string) {
  return useQuery({
    queryKey: [GENRES_KEY, id],
    queryFn: async () => {
      return db.query.genres.findFirst({
        where: eq(genres.id, id),
        with: {
          tracks: {
            with: {
              track: {
                with: {
                  artist: true,
                  album: true,
                },
              },
            },
          },
        },
      })
    },
  })
}
