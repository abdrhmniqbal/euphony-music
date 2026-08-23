import { useQuery } from "@tanstack/react-query"

import { FAVORITES_KEY } from "@/domains/library/query-keys"

import { getFavorites, isFavorite } from "./repository"
import type { FavoriteType } from "./types"

interface QueryOptions {
  enabled?: boolean
}

export function useFavorites(type?: FavoriteType, options: QueryOptions = {}) {
  return useQuery({
    queryKey: [FAVORITES_KEY, type],
    enabled: options.enabled ?? true,
    placeholderData: (previousData) => previousData,
    queryFn: () => getFavorites(type),
  })
}

export function useIsFavorite(type: FavoriteType, itemId: string) {
  const normalizedItemId = itemId.trim()

  return useQuery({
    queryKey: [FAVORITES_KEY, type, normalizedItemId],
    enabled: normalizedItemId.length > 0,
    placeholderData: (previousData) => previousData,
    queryFn: () => isFavorite(normalizedItemId, type),
  })
}
