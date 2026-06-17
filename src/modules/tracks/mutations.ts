import type { getTrackById } from "./repository"

import { useMutation } from "@tanstack/react-query"
import { invalidateQueryKeys } from "@/lib/query-invalidation"
import { queryClient } from "@/lib/tanstack-query"
import { SEARCH_KEY } from "@/modules/library/keys"

import {
  deleteTrackFromDevice,
  type DeleteTrackFromDeviceInput,
} from "./track-device-deletion.service"
import { trackKeys } from "./keys"
import { incrementTrackPlayCount, setTrackFavoriteStatus } from "./repository"

type TrackDetail = Awaited<ReturnType<typeof getTrackById>>

export function useToggleFavoriteTrack() {
  return useMutation(
    {
      mutationFn: setTrackFavoriteStatus,
      onMutate: async ({ trackId, isFavorite }) => {
        await queryClient.cancelQueries({
          queryKey: trackKeys.detail(trackId),
        })
        const previousTrack = queryClient.getQueryData<TrackDetail>(trackKeys.detail(trackId))

        queryClient.setQueryData<TrackDetail>(trackKeys.detail(trackId), (old) =>
          old
            ? {
                ...old,
                isFavorite: isFavorite ? 1 : 0,
              }
            : old
        )

        return { previousTrack }
      },
      onError: (_error, variables, context) => {
        queryClient.setQueryData(trackKeys.detail(variables.trackId), context?.previousTrack)
      },
      onSettled: async (_data, _error, variables) => {
        await invalidateQueryKeys(queryClient, [
          trackKeys.detail(variables.trackId),
          [trackKeys.all()[0]],
        ])
      },
    },
    queryClient
  )
}

export function useIncrementTrackPlayCount() {
  return useMutation(
    {
      mutationFn: incrementTrackPlayCount,
      onSuccess: async (trackId) => {
        await invalidateQueryKeys(queryClient, [trackKeys.detail(trackId)])
      },
    },
    queryClient
  )
}

export function useDeleteTrackFromDevice() {
  return useMutation(
    {
      mutationFn: deleteTrackFromDevice,
      onSuccess: async (result, variables: DeleteTrackFromDeviceInput) => {
        if (result.status !== "deleted") {
          return
        }

        await invalidateQueryKeys(queryClient, [
          [trackKeys.all()[0]],
          trackKeys.detail(variables.trackId),
          [SEARCH_KEY],
        ])
      },
    },
    queryClient
  )
}
