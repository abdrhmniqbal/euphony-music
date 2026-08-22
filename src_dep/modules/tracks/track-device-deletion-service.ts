import * as MediaLibrary from "expo-media-library/legacy"

import { requestMediaLibraryPermission } from "@/modules/shared/core/storage/media-library-service"
import { startIndexing } from "@/modules/indexer/service"
import { logError, logInfo, logWarn } from "@/modules/logging/service"
import { removeFromQueue } from "@/modules/player/queue"

import { hardDeleteTrack } from "./track-cleanup-repository"

export interface DeleteTrackFromDeviceInput {
  trackId: string
  title?: string
}

export type DeleteTrackFromDeviceResult =
  | { status: "deleted" }
  | { status: "permission-denied" }
  | { status: "delete-failed" }
  | { status: "error" }

export async function deleteTrackFromDevice({
  trackId,
  title,
}: DeleteTrackFromDeviceInput): Promise<DeleteTrackFromDeviceResult> {
  const normalizedTrackId = trackId.trim()
  if (!normalizedTrackId) {
    return { status: "error" }
  }

  try {
    logInfo("Deleting track from device", {
      trackId: normalizedTrackId,
      title,
    })

    const { status } = await requestMediaLibraryPermission()
    if (status !== "granted") {
      logWarn("Track deletion blocked by media permission", {
        trackId: normalizedTrackId,
        permissionStatus: status,
      })
      return { status: "permission-denied" }
    }

    const isDeleted = await MediaLibrary.deleteAssetsAsync([normalizedTrackId])
    if (!isDeleted) {
      logWarn("MediaLibrary reported track deletion failure", {
        trackId: normalizedTrackId,
      })
      return { status: "delete-failed" }
    }

    try {
      await removeFromQueue(normalizedTrackId)
    } catch (error) {
      logWarn("Queue cleanup failed after track deletion", {
        trackId: normalizedTrackId,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    try {
      await hardDeleteTrack(normalizedTrackId)
    } catch (error) {
      logWarn("Database cleanup failed after track deletion", {
        trackId: normalizedTrackId,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    logInfo("Deleted track from device", {
      trackId: normalizedTrackId,
      title,
    })
    void startIndexing(false, false)

    return { status: "deleted" }
  } catch (error) {
    logError("Failed to delete track from device", error, {
      trackId: normalizedTrackId,
      title,
    })
    return { status: "error" }
  }
}
