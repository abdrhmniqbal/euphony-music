import { useMutation } from "@tanstack/react-query"

import { i18n } from "@/core/localization/i18n"
import { logError, logInfo } from "@/core/log/service"
import { showAppToast } from "@/core/ui/toast"
import { queryClient } from "@/core/query/query-client"
import { FAVORITES_KEY, TRACKS_KEY, ALBUMS_KEY, ARTISTS_KEY, PLAYLISTS_KEY } from "@/domains/library/query-keys"

import { addFavorite, removeFavorite } from "./repository"
import type { FavoriteEntry, FavoriteType } from "./types"

function sortFavoriteEntries(entries: FavoriteEntry[]) {
  return [...entries].sort((a, b) => b.dateAdded - a.dateAdded)
}

function upsertFavoriteEntry(entry: FavoriteEntry) {
  queryClient
    .getQueriesData<FavoriteEntry[]>({ queryKey: [FAVORITES_KEY] })
    .forEach(([queryKey, currentEntries]) => {
      if (!Array.isArray(currentEntries)) {
        return
      }

      // SAFETY: favorites list queries are keyed [FAVORITES_KEY, FavoriteType?, itemId?] within this module
      const queriedType = queryKey[1] as FavoriteType | undefined
      if (queriedType && queriedType !== entry.type) {
        return
      }

      const nextEntries = currentEntries.filter(
        (item) => !(item.type === entry.type && item.id === entry.id)
      )
      queryClient.setQueryData(queryKey, sortFavoriteEntries([entry, ...nextEntries]))
    })
}

function removeFavoriteEntry(type: FavoriteType, itemId: string) {
  queryClient
    .getQueriesData<FavoriteEntry[]>({ queryKey: [FAVORITES_KEY] })
    .forEach(([queryKey, currentEntries]) => {
      if (!Array.isArray(currentEntries)) {
        return
      }

      queryClient.setQueryData(
        queryKey,
        currentEntries.filter((item) => !(item.type === type && item.id === itemId))
      )
    })
}

export function useToggleFavorite() {
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
      logInfo("Toggling favorite", {
        type,
        itemId,
        isCurrentlyFavorite,
      })
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
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: [FAVORITES_KEY, variables.type, variables.itemId],
        }),
        queryClient.cancelQueries({ queryKey: [FAVORITES_KEY] }),
      ])
      const previousValue = queryClient.getQueryData<boolean>([
        FAVORITES_KEY,
        variables.type,
        variables.itemId,
      ])
      const previousFavoriteLists = queryClient.getQueriesData<FavoriteEntry[]>({
        queryKey: [FAVORITES_KEY],
      })

      queryClient.setQueryData([FAVORITES_KEY, variables.type, variables.itemId], !variables.isCurrentlyFavorite)

      if (variables.isCurrentlyFavorite) {
        removeFavoriteEntry(variables.type, variables.itemId)
      } else {
        upsertFavoriteEntry({
          id: variables.itemId,
          type: variables.type,
          name: variables.name,
          subtitle: variables.subtitle,
          image: variables.image,
          dateAdded: Date.now(),
        })
      }

      return { previousValue, previousFavoriteLists }
    },
    onError: (error, variables, context) => {
      logError("Failed to toggle favorite", error, {
        type: variables.type,
        itemId: variables.itemId,
        isCurrentlyFavorite: variables.isCurrentlyFavorite,
      })
      queryClient.setQueryData([FAVORITES_KEY, variables.type, variables.itemId], context?.previousValue)
      context?.previousFavoriteLists?.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value)
      })
      showAppToast(i18n.t("common.feedback.failedToUpdateFavorite"), variables.name)
    },
    onSuccess: (isFavorite, variables) => {
      logInfo("Toggled favorite", {
        type: variables.type,
        itemId: variables.itemId,
        isFavorite,
      })
      showAppToast(
        isFavorite
          ? i18n.t("common.feedback.addedToFavorites")
          : i18n.t("common.feedback.removedFromFavorites"),
        variables.name
      )
    },
    onSettled: async (_result, _error, _variables) => {
      await queryClient.invalidateQueries({ queryKey: [FAVORITES_KEY] })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [TRACKS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ALBUMS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ARTISTS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [PLAYLISTS_KEY] }),
      ])
    },
  })
}
