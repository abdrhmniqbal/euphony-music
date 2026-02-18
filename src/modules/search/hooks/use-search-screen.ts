import { useQuery } from "@tanstack/react-query"

import {
  fetchGenres,
  mapGenresToCategories,
} from "@/modules/genres/genres.utils"
import { startIndexing } from "@/modules/indexer"

const SEARCH_GENRES_QUERY_KEY = ["search", "genres"] as const

export function useSearchScreen() {
  const { data, refetch } = useQuery({
    queryKey: SEARCH_GENRES_QUERY_KEY,
    queryFn: fetchGenres,
  })
  const genreList = data ?? []

  async function refresh() {
    await startIndexing(true)
    await refetch()
  }

  return {
    categories: mapGenresToCategories(genreList),
    refresh,
  }
}
