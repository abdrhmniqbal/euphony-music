import { Platform } from "react-native"
import { requireNativeModule } from "expo"

let AppUpdater: { downloadAndInstall: (url: string) => void } | null = null

if (Platform.OS === "android") {
  try {
    AppUpdater = requireNativeModule("AppUpdater")
  } catch {
    AppUpdater = null
  }
}

export function downloadAndInstall(url: string): void {
  if (Platform.OS === "android" && AppUpdater) {
    AppUpdater.downloadAndInstall(url)
  }
}
