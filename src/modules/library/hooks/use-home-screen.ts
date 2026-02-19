import { useEffect } from "react"
import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"

import { fetchRecentlyPlayedTracks } from "@/modules/history/history.utils"
import { startIndexing } from "@/modules/indexer"
import type { Track } from "@/modules/player/player.types"
import { getTopTracks } from "@/modules/tracks/tracks.api"

const RECENTLY_PLAYED_LIMIT = 8
const TOP_TRACKS_LIMIT = 25

const HOME_RECENTLY_PLAYED_QUERY_KEY = [
  "home",
  "recently-played",
  RECENTLY_PLAYED_LIMIT,
] as const

const HOME_TOP_TRACKS_QUERY_KEY = [
  "home",
  "top-tracks",
  "all",
  TOP_TRACKS_LIMIT,
] as const

export function useHomeScreen() {
  const isFocused = useIsFocused()
  const {
    data: recentlyPlayedTracksData,
    isLoading: isRecentlyPlayedLoading,
    isFetching: isRecentlyPlayedFetching,
    refetch: refetchRecentlyPlayedTracks,
  } = useQuery<Track[]>({
    queryKey: HOME_RECENTLY_PLAYED_QUERY_KEY,
    queryFn: () => fetchRecentlyPlayedTracks(RECENTLY_PLAYED_LIMIT),
    placeholderData: (previousData) => previousData,
    enabled: false,
  })
  const {
    data: topTracksData,
    isLoading: isTopTracksLoading,
    isFetching: isTopTracksFetching,
    refetch: refetchTopTracks,
  } = useQuery<Track[]>({
    queryKey: HOME_TOP_TRACKS_QUERY_KEY,
    queryFn: () => getTopTracks("all", TOP_TRACKS_LIMIT),
    placeholderData: (previousData) => previousData,
    enabled: false,
  })

  const recentlyPlayedTracks = recentlyPlayedTracksData ?? []
  const topTracks = topTracksData ?? []
  const isLoading =
    (isRecentlyPlayedLoading ||
      isRecentlyPlayedFetching ||
      isTopTracksLoading ||
      isTopTracksFetching) &&
    recentlyPlayedTracks.length === 0 &&
    topTracks.length === 0

  useEffect(() => {
    if (!isFocused) {
      return
    }

    // Refresh only when tab regains focus to keep first paint instant from cache.
    void Promise.all([refetchRecentlyPlayedTracks(), refetchTopTracks()])
  }, [isFocused, refetchRecentlyPlayedTracks, refetchTopTracks])

  async function refresh() {
    startIndexing(false)

    await Promise.all([refetchRecentlyPlayedTracks(), refetchTopTracks()])
  }

  return {
    recentlyPlayedTracks,
    topTracks,
    isLoading,
    refresh,
  }
}
