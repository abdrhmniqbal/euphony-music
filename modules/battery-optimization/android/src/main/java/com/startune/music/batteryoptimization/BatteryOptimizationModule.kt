package com.startune.music.batteryoptimization

import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.net.Uri
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BatteryOptimizationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BatteryOptimization")

    AsyncFunction("isIgnoringBatteryOptimizations") { packageName: String? ->
      val context = appContext.reactContext ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@AsyncFunction true

      val powerManager = context.getSystemService(PowerManager::class.java)
      val target = packageName?.takeIf { it.isNotBlank() } ?: context.packageName

      powerManager?.isIgnoringBatteryOptimizations(target) ?: false
    }

    AsyncFunction("requestIgnoreBatteryOptimizations") { packageName: String? ->
      val context = appContext.reactContext
        ?: return@AsyncFunction "unsupported"

      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@AsyncFunction "unsupported"

      val target = packageName?.takeIf { it.isNotBlank() } ?: context.packageName
      val powerManager = context.getSystemService(PowerManager::class.java)

      if (powerManager?.isIgnoringBatteryOptimizations(target) == true) {
        return@AsyncFunction "already_ignored"
      }

      val requestIntent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:$target")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      try {
        context.startActivity(requestIntent)
        return@AsyncFunction "dialog_opened"
      } catch (_: Exception) {
        // Fall through to settings page
      }

      val settingsIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      try {
        context.startActivity(settingsIntent)
        return@AsyncFunction "settings_opened"
      } catch (_: Exception) {
        return@AsyncFunction "unsupported"
      }
    }

    AsyncFunction("openBatteryOptimizationSettings") {
      val context = appContext.reactContext ?: return@AsyncFunction "unsupported"

      val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }

      try {
        context.startActivity(intent)
        "settings_opened"
      } catch (_: Exception) {
        "unsupported"
      }
    }
  }
}
