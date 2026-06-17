import type { QueryClient } from "@tanstack/react-query"

import { invalidateQueryKeys } from "@/lib/query-invalidation"
import { PLAYLISTS_KEY } from "@/modules/playlist/keys"

export const FAVORITES_KEY = "favorites"

export async function invalidateFavoriteQueries(queryClient: QueryClient) {
  await invalidateQueryKeys(queryClient, [
    [FAVORITES_KEY],
    ["library", "favorites"],
    ["tracks"],
    ["library", "tracks"],
    ["artists"],
    ["albums"],
    [PLAYLISTS_KEY],
  ])
}
