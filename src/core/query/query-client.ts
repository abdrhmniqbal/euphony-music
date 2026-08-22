import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 60,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: "offlineFirst",
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
})
