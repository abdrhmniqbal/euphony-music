import { useDebouncedValue } from "@tanstack/react-pacer/debouncer"
import { useMutation, useQuery } from "@tanstack/react-query"

import { queryClient } from "@/core/query/query-client"
import {
  RECENT_SEARCHES_KEY,
  SEARCH_KEY,
} from "@/domains/library/query-keys"
import type { RecentSearchEntry, RecentSearchType, SearchResults } from "./types"
import {
  addRecentSearch,
  clearRecentSearches,
  deleteRecentSearch,
  getRecentSearches,
  searchLibrary,
} from "./repository"

export const recentSearchKeys = {
  all: () => [RECENT_SEARCHES_KEY] as const,
}

export function useSearch(query: string) {
  const [debouncedQuery] = useDebouncedValue(query, {
    wait: 220,
  })
  const normalizedQuery = debouncedQuery.trim()

  return useQuery<SearchResults>({
    queryKey: [SEARCH_KEY, "query", normalizedQuery],
    placeholderData: (previousData) => previousData,
    queryFn: async () => await searchLibrary(normalizedQuery),
    enabled: normalizedQuery.length > 0,
  })
}

export function useRecentSearches() {
  return useQuery<RecentSearchEntry[]>({
    queryKey: recentSearchKeys.all(),
    queryFn: getRecentSearches,
    placeholderData: (previousData) => previousData,
  })
}

export function useAddRecentSearch() {
  return useMutation({
    mutationFn: addRecentSearch,
    onSuccess: (nextRecentSearches) => {
      queryClient.setQueryData(recentSearchKeys.all(), nextRecentSearches)
    },
  })
}

export function useDeleteRecentSearch() {
  return useMutation({
    mutationFn: (id: string) => deleteRecentSearch(id),
    onSuccess: (nextRecentSearches) => {
      queryClient.setQueryData(recentSearchKeys.all(), nextRecentSearches)
    },
  })
}

export function useClearRecentSearches() {
  return useMutation({
    mutationFn: () => clearRecentSearches(),
    onSuccess: (nextRecentSearches) => {
      queryClient.setQueryData(recentSearchKeys.all(), nextRecentSearches)
    },
  })
}

export type { RecentSearchType }
