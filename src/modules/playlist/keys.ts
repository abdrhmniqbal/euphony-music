import type { QueryClient } from "@tanstack/react-query"

import { invalidateQueryKeys } from "@/lib/query-invalidation"

export const PLAYLISTS_KEY = "playlists"

export const playlistKeys = {
  all: [PLAYLISTS_KEY] as const,
  detail: (playlistId: string) => [PLAYLISTS_KEY, playlistId] as const,
  membership: (trackId: string) =>
    [PLAYLISTS_KEY, "track-membership", trackId] as const,
}

export async function invalidatePlaylistQueries(
  queryClient: QueryClient,
  options?: {
    playlistId?: string | null
    trackId?: string | null
  }
) {
  const queryKeys: Array<readonly unknown[]> = [playlistKeys.all]

  if (options?.playlistId) {
    queryKeys.push(playlistKeys.detail(options.playlistId))
  }

  if (options?.trackId) {
    queryKeys.push(playlistKeys.membership(options.trackId))
  }

  await invalidateQueryKeys(queryClient, queryKeys)
}
