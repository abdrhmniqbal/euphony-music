import { useQuery } from "@tanstack/react-query"

import {
  fetchGenreAlbums,
  mapAlbumsToGridData,
} from "@/modules/genres/genres.utils"
import { startIndexing } from "@/modules/indexer"

const GENRE_ALBUMS_QUERY_KEY = "genre-albums"

export function useGenreAlbumsScreen(genreName: string) {
  const normalizedGenreName = genreName.trim()
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [GENRE_ALBUMS_QUERY_KEY, normalizedGenreName],
    queryFn: () => fetchGenreAlbums(normalizedGenreName),
    enabled: normalizedGenreName.length > 0,
  })

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  return {
    albumData: mapAlbumsToGridData(data ?? []),
    isLoading: isLoading || isFetching,
    refresh,
  }
}
