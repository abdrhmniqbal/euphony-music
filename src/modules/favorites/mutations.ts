/**
 * Purpose: Provides optimistic favorite add, remove, and toggle mutations.
 * Caller: favorite buttons, favorites list rows, player info, action sheets, and media detail screens.
 * Dependencies: TanStack Query cache, favorite repository, favorite query keys, logging service.
 * Main Functions: useAddFavorite(), useRemoveFavorite(), useToggleFavorite()
 * Side Effects: Writes favorite flags through repository, updates favorites cache optimistically, invalidates favorite/library queries.
 */

import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"
import { i18n } from "@/modules/localization/i18n"
import { logError, logInfo } from "@/modules/logging/service"
import { showAppToast } from "@/modules/ui/toast"

import { FAVORITES_KEY, invalidateFavoriteQueries } from "./keys"
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

function useAddFavorite() {
  return useMutation(
    {
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
        logInfo("Adding favorite", { type, itemId })
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
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: [FAVORITES_KEY] })
        upsertFavoriteEntry({
          id: variables.itemId,
          type: variables.type,
          name: variables.name,
          subtitle: variables.subtitle,
          image: variables.image,
          dateAdded: Date.now(),
        })
      },
      onSuccess: async (_result, variables) => {
        logInfo("Added favorite", {
          type: variables.type,
          itemId: variables.itemId,
        })
        showAppToast(i18n.t("common.feedback.addedToFavorites"), variables.name)
        await invalidateFavoriteQueries(queryClient)
      },
      onError: (error, variables) => {
        logError("Failed to add favorite", error, {
          type: variables.type,
          itemId: variables.itemId,
        })
        showAppToast(i18n.t("common.feedback.failedToUpdateFavorite"), variables.name)
      },
    },
    queryClient
  )
}

function useRemoveFavorite() {
  return useMutation(
    {
      mutationFn: async ({ type, itemId }: { type: FavoriteType; itemId: string }) => {
        logInfo("Removing favorite", { type, itemId })
        await removeFavorite(itemId, type)

        return { type, itemId }
      },
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: [FAVORITES_KEY] })
        removeFavoriteEntry(variables.type, variables.itemId)
      },
      onSuccess: async (_result, variables) => {
        logInfo("Removed favorite", {
          type: variables.type,
          itemId: variables.itemId,
        })
        showAppToast(i18n.t("common.feedback.removedFromFavorites"))
        await invalidateFavoriteQueries(queryClient)
      },
      onError: (error, variables) => {
        logError("Failed to remove favorite", error, {
          type: variables.type,
          itemId: variables.itemId,
        })
        showAppToast(i18n.t("common.feedback.failedToUpdateFavorite"))
      },
    },
    queryClient
  )
}

export function useToggleFavorite() {
  return useMutation(
    {
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

        queryClient.setQueryData(
          [FAVORITES_KEY, variables.type, variables.itemId],
          !variables.isCurrentlyFavorite
        )

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
        queryClient.setQueryData(
          [FAVORITES_KEY, variables.type, variables.itemId],
          context?.previousValue
        )
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
      onSettled: async (_result, _error, variables) => {
        logInfo("Refreshing favorite queries after toggle", {
          type: variables.type,
          itemId: variables.itemId,
        })
        await invalidateFavoriteQueries(queryClient)
      },
    },
    queryClient
  )
}
