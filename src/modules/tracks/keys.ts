import type { QueryClient } from "@tanstack/react-query"
import { invalidateQueryKeys } from "@/lib/query-invalidation"

export const TRACKS_KEY = "tracks"

export const trackKeys = {
  all: (filters?: unknown) => [TRACKS_KEY, filters] as const,
  detail: (trackId: string) => [TRACKS_KEY, trackId] as const,
}

export async function invalidateTrackQueries(
  queryClient: QueryClient,
  options?: {
    trackId?: string | null
  }
) {
  const keys: Array<readonly unknown[]> = [[TRACKS_KEY]]

  if (options?.trackId) {
    keys.push(trackKeys.detail(options.trackId))
  }

  await invalidateQueryKeys(queryClient, keys)
}
