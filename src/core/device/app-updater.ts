import { NativeModules, Platform } from "react-native"

import { logWarn } from "@/core/log/service"

let appUpdaterModule: { downloadAndInstall: (url: string) => void } | null = null

if (Platform.OS === "android") {
  // SAFETY: the Android app registers a native AppUpdater module exposing exactly this downloadAndInstall contract
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
