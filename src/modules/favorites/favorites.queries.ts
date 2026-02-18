import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  addFavorite,
  getFavorites,
  isFavorite,
  removeFavorite,
  type FavoriteType,
} from "@/modules/favorites/favorites.api"

const FAVORITES_KEY = "favorites"

interface QueryOptions {
  enabled?: boolean
}

async function invalidateFavoriteQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] }),
    queryClient.invalidateQueries({ queryKey: ["library", "favorites"] }),
    queryClient.invalidateQueries({ queryKey: ["tracks"] }),
    queryClient.invalidateQueries({ queryKey: ["library", "tracks"] }),
    queryClient.invalidateQueries({ queryKey: ["artists"] }),
    queryClient.invalidateQueries({ queryKey: ["albums"] }),
    queryClient.invalidateQueries({ queryKey: ["playlists"] }),
  ])
}

export function useFavorites(type?: FavoriteType, options: QueryOptions = {}) {
  return useQuery({
    queryKey: [FAVORITES_KEY, type],
    enabled: options.enabled ?? true,
    placeholderData: (previousData) => previousData,
    queryFn: () => getFavorites(type),
  })
}

export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      type,
      itemId,
      name,
      subtitle,
      image,
    }: {
      type: FavoriteType
      itemId: string
      name: string
      subtitle?: string
      image?: string
    }) => {
      const now = Date.now()
      await addFavorite({
        id: itemId,
        type,
        name,
        subtitle,
        image,
        dateAdded: now,
      })

      return { type, itemId, favoritedAt: now }
    },
    onSuccess: async () => {
      await invalidateFavoriteQueries(queryClient)
    },
  })
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      type,
      itemId,
    }: {
      type: FavoriteType
      itemId: string
    }) => {
      await removeFavorite(itemId, type)

      return { type, itemId }
    },
    onSuccess: async () => {
      await invalidateFavoriteQueries(queryClient)
    },
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

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      type,
      itemId,
      isCurrentlyFavorite,
      name,
      subtitle,
      image,
    }: {
      type: FavoriteType
      itemId: string
      isCurrentlyFavorite: boolean
      name: string
      subtitle?: string
      image?: string
    }) => {
      if (isCurrentlyFavorite) {
        await removeFavorite(itemId, type)
      } else {
        await addFavorite({
          id: itemId,
          type,
          name,
          subtitle,
          image,
          dateAdded: Date.now(),
        })
      }

      return !isCurrentlyFavorite
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: [FAVORITES_KEY, variables.type, variables.itemId],
      })
      const previousValue = queryClient.getQueryData<boolean>([
        FAVORITES_KEY,
        variables.type,
        variables.itemId,
      ])

      queryClient.setQueryData(
        [FAVORITES_KEY, variables.type, variables.itemId],
        !variables.isCurrentlyFavorite
      )

      return { previousValue }
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(
        [FAVORITES_KEY, variables.type, variables.itemId],
        context?.previousValue
      )
    },
    onSettled: async () => {
      await invalidateFavoriteQueries(queryClient)
    },
  })
}
