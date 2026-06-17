import { usePermissions as useMediaLibraryPermissions } from "expo-media-library/legacy"
import { useCallback, useEffect, useState } from "react"

import { preferenceStore } from "@/stores/preference/store"
import { findAndSaveArtwork } from "../helpers/artwork"
import { findAndSaveAudio } from "../helpers/audio"
import { appCleanUp } from "../helpers/cleanup"

export function useScanning(canStart: boolean) {
  const [permissionResponse, requestPermission] = useMediaLibraryPermissions({ granularPermissions: ["audio"] })
  const [status, setStatus] = useState<"in-progress" | "complete" | undefined>()
  const [error, setError] = useState<Error>()

  const readMusicLibrary = useCallback(async () => {
    if (permissionResponse?.status !== "granted") {
      const permission = await requestPermission()
      if (permission.canAskAgain || permission.status !== "granted") {
        if (permission.status === "denied") setStatus("complete")
        return
      }
    }

    setStatus("in-progress")
    if (preferenceStore.getState().rescanOnLaunch) {
      const { foundFiles } = await findAndSaveAudio()
      await appCleanUp.tracks(foundFiles.map(({ id }) => id))
      await findAndSaveArtwork()
    } else {
      await appCleanUp.media()
    }

    await appCleanUp.images()
    setStatus("complete")
  }, [permissionResponse, requestPermission])

  useEffect(() => {
    if (!canStart || !permissionResponse || status !== undefined) return
    readMusicLibrary().catch(setError)
  }, [canStart, permissionResponse, readMusicLibrary, status])

  return { completed: status === "complete", error }
}
