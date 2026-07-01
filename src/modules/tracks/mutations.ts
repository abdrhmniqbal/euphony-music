import { useMutation } from "@tanstack/react-query"
import { queryClient } from "@/lib/tanstack-query"
import { invalidateLibraryQueries } from "@/modules/library/keys"

import {
  deleteTrackFromDevice,
  type DeleteTrackFromDeviceInput,
} from "./track-device-deletion-service"
import { invalidateTrackQueries } from "./keys"

export function useDeleteTrackFromDevice() {
  return useMutation(
    {
      mutationFn: deleteTrackFromDevice,
      onSuccess: async (result, variables: DeleteTrackFromDeviceInput) => {
        if (result.status !== "deleted") {
          return
        }

        await invalidateTrackQueries(queryClient, { trackId: variables.trackId })
        await invalidateLibraryQueries(queryClient)
      },
    },
    queryClient
  )
}
