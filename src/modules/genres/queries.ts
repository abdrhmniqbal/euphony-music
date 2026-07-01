import { useQuery } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"

import { genreKeys } from "./keys"
import { getAllGenreVisuals, getGenreById } from "./repository"

export function useGenres() {
  return useQuery(
    {
      queryKey: genreKeys.all(),
      queryFn: getAllGenreVisuals,
      placeholderData: (previousData) => previousData,
    },
    queryClient
  )
}

function useGenre(id: string) {
  return useQuery(
    {
      queryKey: genreKeys.detail(id),
      queryFn: async () => await getGenreById(id),
    },
    queryClient
  )
}
