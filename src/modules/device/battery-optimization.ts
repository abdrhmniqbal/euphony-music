import { NativeModules, Platform } from "react-native"

import { logError, logWarn } from "@/modules/logging/service"

type BatteryOptimizationResult = "already_ignored" | "dialog_opened" | "settings_opened" | "unsupported"

interface BatteryOptimizationNativeModule {
  isIgnoringBatteryOptimizations: (packageName?: string) => Promise<boolean>
  requestIgnoreBatteryOptimizations: (packageName?: string) => Promise<BatteryOptimizationResult>
  openBatteryOptimizationSettings: () => Promise<"settings_opened">
}

let batteryOptimizationModule: BatteryOptimizationNativeModule | null = null

if (Platform.OS === "android") {
  batteryOptimizationModule = NativeModules.BatteryOptimization as BatteryOptimizationNativeModule | null
  if (!batteryOptimizationModule) {
    logWarn("BatteryOptimization native module not available")
  }
}

export async function isIgnoringBatteryOptimizations(packageName?: string): Promise<boolean> {
  if (Platform.OS !== "android" || !batteryOptimizationModule) {
    return true
  }

  try {
    return await batteryOptimizationModule.isIgnoringBatteryOptimizations(packageName)
  } catch (error) {
    logError("Failed to check battery optimization ignore status", error, { packageName })
    return false
  }
}

export async function requestIgnoreBatteryOptimizations(
  packageName?: string
): Promise<BatteryOptimizationResult> {
  if (Platform.OS !== "android" || !batteryOptimizationModule) {
    return "unsupported"
  }

  try {
    return await batteryOptimizationModule.requestIgnoreBatteryOptimizations(packageName)
  } catch (error) {
    logError("Failed to request battery optimization ignore flow", error, { packageName })
    return "unsupported"
  }
}

export async function openBatteryOptimizationSettings(): Promise<boolean> {
  if (Platform.OS !== "android" || !batteryOptimizationModule) {
    return false
  }

  try {
    const result = await batteryOptimizationModule.openBatteryOptimizationSettings()
    return result === "settings_opened"
  } catch (error) {
    logError("Failed to open battery optimization settings", error)
    return false
  }
}
