/**
 * Purpose: Exposes React Query mutations for recording, incrementing, and resetting listening history.
 * Caller: player activity flow, playback history UI, advanced settings maintenance actions.
 * Dependencies: TanStack Query client, history repository, query invalidation helpers, track query keys.
 * Main Functions: useAddToHistory(), useIncrementPlayCount(), useResetListeningHistory()
 * Side Effects: Writes play history and track counters; invalidates history and track caches.
 */

import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"
import { invalidateTrackQueries } from "@/modules/tracks/keys"

import { historyKeys } from "./keys"
import { resetListeningHistory } from "./repository"

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
          invalidateTrackQueries(queryClient),
        ])
      },
    },
    queryClient
  )
}
