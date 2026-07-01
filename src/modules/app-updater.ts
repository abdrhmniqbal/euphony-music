import { Platform } from "react-native"
import { requireNativeModule } from "expo"

const TAG = "[AppUpdater]"

let AppUpdater: { downloadAndInstall: (url: string) => void } | null = null

if (Platform.OS === "android") {
  try {
    AppUpdater = requireNativeModule("AppUpdater")
    console.log(TAG, "Native module loaded successfully")
  } catch (e) {
    console.warn(TAG, "Native module not available:", e)
  }
} else {
  console.log(TAG, "Skipping native module on", Platform.OS)
}

export function downloadAndInstall(url: string): void {
  console.log(TAG, "downloadAndInstall called with url:", url)

  if (Platform.OS === "android" && AppUpdater) {
    try {
      AppUpdater.downloadAndInstall(url)
      console.log(TAG, "downloadAndInstall dispatched to native")
    } catch (e) {
      console.error(TAG, "downloadAndInstall failed:", e)
    }
  } else {
    console.warn(TAG, "downloadAndInstall not available on this platform")
  }
}
