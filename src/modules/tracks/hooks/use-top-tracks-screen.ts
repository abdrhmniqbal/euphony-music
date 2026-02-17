import { useEffect, useState } from "react"
import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"

import { startIndexing } from "@/modules/indexer"
import { playTrack } from "@/modules/player/player.store"
import type { Track } from "@/modules/player/player.types"
import { getTopTracks, type TopTracksPeriod } from "@/modules/tracks/tracks.api"

export const TOP_TRACKS_TABS = ["Realtime", "Daily", "Weekly"] as const
export type TopTracksTab = (typeof TOP_TRACKS_TABS)[number]

const TOP_TRACKS_LIMIT = 10

function tabToPeriod(tab: TopTracksTab): TopTracksPeriod {
  if (tab === "Daily") {
    return "day"
  }

  if (tab === "Weekly") {
    return "week"
  }

  return "all"
}

export function useTopTracksScreen() {
  const [activeTab, setActiveTab] = useState<TopTracksTab>("Realtime")
  const isFocused = useIsFocused()
  const period = tabToPeriod(activeTab)
  const { data: currentTracks = [], refetch } = useQuery<Track[]>({
    queryKey: ["top-tracks-screen", period, TOP_TRACKS_LIMIT],
    queryFn: () => getTopTracks(period, TOP_TRACKS_LIMIT),
    enabled: false,
    initialData: [],
  })

  useEffect(() => {
    if (!isFocused) {
      return
    }

    void refetch()
  }, [isFocused, period, refetch])

  async function refresh() {
    startIndexing(true)
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
    refresh,
    playAll,
    shuffle,
  }
}
