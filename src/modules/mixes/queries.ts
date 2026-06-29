import { useQuery } from "@tanstack/react-query"
import { queryClient } from "@/lib/tanstack-query"
import { getDailyMix, getForYouMix } from "./repository"

export const mixKeys = {
  all: ["mixes", "v3"] as const,
  daily: () => [...mixKeys.all, "daily"] as const,
  forYou: () => [...mixKeys.all, "forYou"] as const,
}

export function useDailyMix() {
  return useQuery(
    {
      queryKey: mixKeys.daily(),
      queryFn: getDailyMix,
      staleTime: 0, // DB manages freshness via generatedAt/expiresAt
    },
    queryClient
  )
}

export function useForYouMix() {
  return useQuery(
    {
      queryKey: mixKeys.forYou(),
      queryFn: getForYouMix,
      staleTime: 0, // DB manages freshness via generatedAt/expiresAt
    },
    queryClient
  )
}
