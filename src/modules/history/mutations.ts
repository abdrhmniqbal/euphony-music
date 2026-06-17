/**
 * Purpose: Exposes React Query mutations for recording, incrementing, and resetting listening history.
 * Caller: player activity flow, playback history UI, advanced settings maintenance actions.
 * Dependencies: TanStack Query client, history repository, query invalidation helpers, track query keys.
 * Main Functions: useAddToHistory(), useIncrementPlayCount(), useResetListeningHistory()
 * Side Effects: Writes play history and track counters; invalidates history and track caches.
 */

import { useMutation } from "@tanstack/react-query"

import { invalidateQueryKeys } from "@/lib/query-invalidation"
import { queryClient } from "@/lib/tanstack-query"
import { trackKeys } from "@/modules/tracks/keys"

import { historyKeys } from "./keys"
import { addTrackToHistory, incrementTrackPlayCount, resetListeningHistory } from "./repository"

export function useAddToHistory() {
  return useMutation(
    {
      mutationFn: async (trackId: string) => {
        await addTrackToHistory(trackId)
        return trackId
      },
      onSuccess: async () => {
        await invalidateQueryKeys(queryClient, [historyKeys.tracks()])
      },
    },
    queryClient
  )
}

export function useIncrementPlayCount() {
  const addToHistory = useAddToHistory()

  return useMutation(
    {
      mutationFn: async (trackId: string) => {
        await incrementTrackPlayCount(trackId)
        await addToHistory.mutateAsync(trackId)
        return trackId
      },
      onSuccess: async () => {
        await invalidateQueryKeys(queryClient, [trackKeys.all(), historyKeys.tracks()])
      },
    },
    queryClient
  )
}

export function useResetListeningHistory() {
  return useMutation(
    {
      mutationFn: resetListeningHistory,
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: historyKeys.tracks() }),
          queryClient.invalidateQueries({
            queryKey: [historyKeys.recentlyPlayed(0)[0]],
          }),
          queryClient.invalidateQueries({
            queryKey: [historyKeys.topTracks("all", 0)[0]],
          }),
          queryClient.invalidateQueries({ queryKey: [trackKeys.all()[0]] }),
        ])
      },
    },
    queryClient
  )
}
