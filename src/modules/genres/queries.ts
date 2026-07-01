import { useQuery } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"

import { genreKeys } from "./keys"
import { getAllGenreVisuals } from "./repository"

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

