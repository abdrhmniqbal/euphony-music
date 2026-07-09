import * as MediaLibrary from "expo-media-library/legacy"
import { logError, logInfo } from "@/modules/logging/service"

export async function getMediaLibraryPermission() {
  try {
    const permission = await MediaLibrary.getPermissionsAsync()
    logInfo("Read media library permission", {
      status: permission.status,
      canAskAgain: permission.canAskAgain,
    })
    return permission
  } catch (error) {
    logError("Failed to read media library permission", error)
    throw error
  }
}

export async function requestMediaLibraryPermission() {
  try {
    logInfo("Requesting media library permission")
    const permission = await MediaLibrary.requestPermissionsAsync()
    logInfo("Media library permission request completed", {
      status: permission.status,
      canAskAgain: permission.canAskAgain,
    })
    return permission
  } catch (error) {
    logError("Failed to request media library permission", error)
    throw error
  }
}
