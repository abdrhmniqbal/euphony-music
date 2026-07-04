import { Platform } from "react-native"
import { requireNativeModule } from "expo"
import { logError, logInfo, logWarn } from "@/modules/logging/service"

const TAG = "[BatteryOptimization]"

type BatteryOptimizationResult = "already_ignored" | "dialog_opened" | "settings_opened" | "unsupported"

interface BatteryOptimizationNativeModule {
  isIgnoringBatteryOptimizations: (packageName?: string) => Promise<boolean>
  requestIgnoreBatteryOptimizations: (packageName?: string) => Promise<BatteryOptimizationResult>
  openBatteryOptimizationSettings: () => Promise<"settings_opened">
}

let BatteryOptimizationModule: BatteryOptimizationNativeModule | null = null

if (Platform.OS === "android") {
  try {
    BatteryOptimizationModule = requireNativeModule("BatteryOptimization")
    logInfo(TAG, "Native module loaded successfully")
  } catch (e) {
    logWarn(TAG, "Native module not available:", e)
  }
} else {
  logInfo(TAG, "Skipping native module on", Platform.OS)
}

export async function isIgnoringBatteryOptimizations(packageName?: string): Promise<boolean> {
  if (Platform.OS !== "android" || !BatteryOptimizationModule) {
    return false
  }

  try {
    const result = await BatteryOptimizationModule.isIgnoringBatteryOptimizations(packageName)
    logInfo(TAG, "Checked battery optimization status", { packageName, isIgnoring: result })
    return result
  } catch (error) {
    logError(TAG, "Failed to check battery optimization status", error, { packageName })
    return false
  }
}

export async function requestIgnoreBatteryOptimizations(
  packageName?: string
): Promise<BatteryOptimizationResult> {
  if (Platform.OS !== "android" || !BatteryOptimizationModule) {
    return "unsupported"
  }

  try {
    const result = await BatteryOptimizationModule.requestIgnoreBatteryOptimizations(packageName)
    logInfo(TAG, "Requested battery optimization ignore", { packageName, result })
    return result
  } catch (error) {
    logError(TAG, "Failed to request battery optimization ignore", error, { packageName })
    return "unsupported"
  }
}

export async function openBatteryOptimizationSettings(): Promise<boolean> {
  if (Platform.OS !== "android" || !BatteryOptimizationModule) {
    return false
  }

  try {
    const result = await BatteryOptimizationModule.openBatteryOptimizationSettings()
    logInfo(TAG, "Opened battery optimization settings", { result })
    return result === "settings_opened"
  } catch (error) {
    logError(TAG, "Failed to open battery optimization settings", error)
    return false
  }
}
