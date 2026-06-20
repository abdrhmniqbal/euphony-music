import * as MediaLibrary from "expo-media-library/legacy"
import * as Notifications from "expo-notifications"
import * as Application from "expo-application"
import { Linking, Platform } from "react-native"
import { useState, useEffect } from "react"
import {
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings,
  requestIgnoreBatteryOptimizations,
} from "@/modules/device/battery-optimization"

export function useOnboardingPermissions({
  showToast,
}: {
  showToast: (title: string, message: string) => void
}) {
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null)
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false)
  const [batteryOptimizationDisabled, setBatteryOptimizationDisabled] = useState(false)

  async function checkPermissionStatus() {
    const { status } = await MediaLibrary.getPermissionsAsync()
    setMediaPermission(status === "granted")

    const notificationPermissions = await Notifications.getPermissionsAsync()
    setNotificationPermissionGranted(notificationPermissions.granted)

    if (Platform.OS === "android") {
      const appPackage = Application.applicationId || "com.startune.music"
      const isIgnoring = await isIgnoringBatteryOptimizations(appPackage)
      setBatteryOptimizationDisabled(isIgnoring)
    }
  }

  useEffect(() => {
    void checkPermissionStatus()
  }, [])

  async function requestMediaPermission(titleStr: string, grantStr: string) {
    const { status } = await MediaLibrary.requestPermissionsAsync()
    const granted = status === "granted"
    setMediaPermission(granted)
    if (granted) {
      showToast(titleStr, grantStr)
    }
  }

  async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync()
    setNotificationPermissionGranted(status === "granted")
  }

  async function requestBatteryOptimization() {
    const appPackage = Application.applicationId || "com.startune.music"
    const BATTERY_SETTINGS_ACTION = "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"

    try {
      if (Platform.OS !== "android") {
        await Linking.openSettings()
        return
      }

      if (await isIgnoringBatteryOptimizations(appPackage)) {
        setBatteryOptimizationDisabled(true)
        return
      }

      const requestResult = await requestIgnoreBatteryOptimizations(appPackage)
      if (requestResult === "dialog_opened" || requestResult === "settings_opened") {
        return
      }

      if (await openBatteryOptimizationSettings()) {
        return
      }

      try {
        await Linking.sendIntent(BATTERY_SETTINGS_ACTION)
        return
      } catch {
        // Fall through to app settings.
      }
    } catch {
      // Fall through to app settings.
    }

    await Linking.openSettings()
  }

  return {
    mediaPermission,
    notificationPermissionGranted,
    batteryOptimizationDisabled,
    requestMediaPermission,
    requestNotificationPermission,
    requestBatteryOptimization,
  }
}
