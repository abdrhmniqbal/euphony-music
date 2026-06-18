import type { QueryClient } from "@tanstack/react-query"

import { invalidateQueryKeys } from "@/lib/query-invalidation"
import { invalidateLibraryQueries } from "@/modules/library/keys"
import { invalidatePlaylistQueries } from "@/modules/playlist/keys"
import { invalidateTrackQueries } from "@/modules/tracks/keys"

export const FAVORITES_KEY = "favorites"

export async function invalidateFavoriteQueries(queryClient: QueryClient) {
  await invalidateQueryKeys(queryClient, [[FAVORITES_KEY]])
  await Promise.all([
    invalidateLibraryQueries(queryClient),
    invalidatePlaylistQueries(queryClient),
    invalidateTrackQueries(queryClient),
  ])
}
