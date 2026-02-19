import { useQuery } from "@tanstack/react-query"

import { fetchGenreTopTracks } from "@/modules/genres/genres.utils"
import { startIndexing } from "@/modules/indexer"
import { playTrack } from "@/modules/player/player.store"

const GENRE_TOP_TRACKS_QUERY_KEY = "genre-top-tracks"

export function useGenreTopTracksScreen(genreName: string) {
  const normalizedGenreName = genreName.trim()
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [GENRE_TOP_TRACKS_QUERY_KEY, normalizedGenreName],
    queryFn: () => fetchGenreTopTracks(normalizedGenreName),
    enabled: normalizedGenreName.length > 0,
  })
  const tracks = data ?? []

  async function refresh() {
    await startIndexing(false)
    await refetch()
  }

  function playAll() {
    if (tracks.length === 0) {
      return
    }

    playTrack(tracks[0], tracks)
  }

  function shuffle() {
    if (tracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * tracks.length)
    playTrack(tracks[randomIndex], tracks)
  }

  return {
    tracks,
    isLoading: isLoading || isFetching,
    refresh,
    playAll,
    shuffle,
  }
}
