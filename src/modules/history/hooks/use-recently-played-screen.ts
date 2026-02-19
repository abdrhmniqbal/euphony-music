import type { Track } from '@/modules/player/player.types'
import { useIsFocused } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'

import { useEffect } from 'react'
import { fetchRecentlyPlayedTracks } from '@/modules/history/history.utils'
import { startIndexing } from '@/modules/indexer'
import { playTrack } from '@/modules/player/player.store'

const RECENTLY_PLAYED_QUERY_KEY = ['recently-played-screen'] as const
const RECENTLY_PLAYED_SCREEN_LIMIT = 50

export function useRecentlyPlayedScreen() {
  const isFocused = useIsFocused()
  const {
    data: historyData,
    isLoading,
    isFetching,
    refetch: refetchHistory,
  } = useQuery<Track[]>({
    queryKey: RECENTLY_PLAYED_QUERY_KEY,
    queryFn: () => fetchRecentlyPlayedTracks(RECENTLY_PLAYED_SCREEN_LIMIT),
    enabled: false,
    placeholderData: previousData => previousData,
  })
  const history = historyData ?? []

  useEffect(() => {
    if (!isFocused) {
      return
    }

    void refetchHistory()
  }, [isFocused, refetchHistory])

  async function refresh() {
    startIndexing(false)
    await refetchHistory()
  }

  function playFirst() {
    if (history.length === 0) {
      return
    }

    playTrack(history[0], history)
  }

  function shuffle() {
    if (history.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * history.length)
    playTrack(history[randomIndex], history)
  }

  return {
    history,
    isLoading: (isLoading || isFetching) && history.length === 0,
    refresh,
    playFirst,
    shuffle,
  }
}
