import { NativeModules, Platform } from "react-native"

import { logWarn } from "@/modules/logging/service"

let appUpdaterModule: { downloadAndInstall: (url: string) => void } | null = null

if (Platform.OS === "android") {
  appUpdaterModule = NativeModules.AppUpdater as { downloadAndInstall: (url: string) => void } | null
  if (!appUpdaterModule) {
    logWarn("AppUpdater native module not available")
  }
}

export function downloadAndInstall(url: string): void {
  if (Platform.OS === "android" && appUpdaterModule) {
    appUpdaterModule.downloadAndInstall(url)
  }
}
