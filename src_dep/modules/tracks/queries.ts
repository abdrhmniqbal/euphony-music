import { useQuery } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"

import { trackKeys } from "./keys"
import { getTrackById, listTracks } from "./repository"
import type { TrackFilter } from "./types"

export type { TrackFilter } from "./types"

export function useTracks(filters?: TrackFilter) {
  return useQuery(
    {
      queryKey: trackKeys.all(filters),
      placeholderData: (previousData) => previousData,
      queryFn: async () => await listTracks(filters),
    },
    queryClient
  )
}

export function useTrack(id: string) {
  const normalizedId = id.trim()

  return useQuery(
    {
      queryKey: trackKeys.detail(normalizedId),
      enabled: normalizedId.length > 0,
      queryFn: async () => await getTrackById(normalizedId),
    },
    queryClient
  )
}
