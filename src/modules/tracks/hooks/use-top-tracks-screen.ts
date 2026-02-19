import type { Track } from '@/modules/player/player.types'
import { useIsFocused } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'

import { useEffect, useState } from 'react'
import { startIndexing } from '@/modules/indexer'
import { playTrack } from '@/modules/player/player.store'
import { getTopTracks, type TopTracksPeriod } from '@/modules/tracks/tracks.api'

export const TOP_TRACKS_TABS = ['Realtime', 'Daily', 'Weekly'] as const
export type TopTracksTab = (typeof TOP_TRACKS_TABS)[number]

const TOP_TRACKS_LIMIT = 50

function tabToPeriod(tab: TopTracksTab): TopTracksPeriod {
  if (tab === 'Daily') {
    return 'day'
  }

  if (tab === 'Weekly') {
    return 'week'
  }

  return 'all'
}

export function useTopTracksScreen() {
  const [activeTab, setActiveTab] = useState<TopTracksTab>('Realtime')
  const isFocused = useIsFocused()
  const period = tabToPeriod(activeTab)
  const {
    data: currentTracksData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Track[]>({
    queryKey: ['top-tracks-screen', period, TOP_TRACKS_LIMIT],
    queryFn: () => getTopTracks(period, TOP_TRACKS_LIMIT),
    enabled: false,
    placeholderData: previousData => previousData,
  })
  const currentTracks = currentTracksData ?? []

  useEffect(() => {
    if (!isFocused) {
      return
    }

    void refetch()
  }, [isFocused, period, refetch])

  async function refresh() {
    startIndexing(false)
    await refetch()
  }

  function playAll() {
    if (currentTracks.length === 0) {
      return
    }

    playTrack(currentTracks[0], currentTracks)
  }

  function shuffle() {
    if (currentTracks.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * currentTracks.length)
    playTrack(currentTracks[randomIndex], currentTracks)
  }

  return {
    activeTab,
    setActiveTab,
    currentTracks,
    isLoading: (isLoading || isFetching) && currentTracks.length === 0,
    refresh,
    playAll,
    shuffle,
  }
}
