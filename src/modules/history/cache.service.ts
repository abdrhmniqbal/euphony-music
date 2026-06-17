import type { QueryClient } from "@tanstack/react-query"

import { invalidateQueryKeys } from "@/lib/query-invalidation"
import type { Track } from "@/modules/player/types"
import { TRACKS_KEY } from "@/modules/tracks/keys"

import {
  HISTORY_KEY,
  HISTORY_RECENTLY_PLAYED_KEY,
  HISTORY_TOP_TRACKS_KEY,
} from "./keys"

const RECENTLY_PLAYED_SCREEN_LIMIT = 50
const HOME_RECENTLY_PLAYED_LIMIT = 8

function prependUniqueTrack(
  current: Track[] | undefined,
  track: Track,
  limit: number
): Track[] {
  const existing = current ?? []
  return [track, ...existing.filter((item) => item.id !== track.id)].slice(
    0,
    limit
  )
}

export function optimisticallyUpdateRecentlyPlayedHistory(
  queryClient: QueryClient,
  track: Track
) {
  queryClient.setQueryData<Track[]>(
    [HISTORY_RECENTLY_PLAYED_KEY, RECENTLY_PLAYED_SCREEN_LIMIT],
    (previous) =>
      prependUniqueTrack(previous, track, RECENTLY_PLAYED_SCREEN_LIMIT)
  )
  queryClient.setQueryData<Track[]>(
    [HISTORY_RECENTLY_PLAYED_KEY, HOME_RECENTLY_PLAYED_LIMIT],
    (previous) =>
      prependUniqueTrack(previous, track, HOME_RECENTLY_PLAYED_LIMIT)
  )
}

export async function invalidateHistoryAfterPlayback(
  queryClient: QueryClient
) {
  await invalidateQueryKeys(queryClient, [
    [HISTORY_KEY],
    [HISTORY_RECENTLY_PLAYED_KEY],
    [HISTORY_TOP_TRACKS_KEY],
    [TRACKS_KEY],
  ])
}
