package com.startune.music.modules.batteryoptimization

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BatteryOptimizationModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "BatteryOptimization"

  @ReactMethod
  fun isIgnoringBatteryOptimizations(packageName: String?, promise: Promise) {
    try {
      val context = reactApplicationContext
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve(true)
        return
      }
      val target = packageName?.takeIf { it.isNotBlank() } ?: context.packageName
      val powerManager = context.getSystemService(PowerManager::class.java)
      promise.resolve(powerManager?.isIgnoringBatteryOptimizations(target) ?: false)
    } catch (_: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun requestIgnoreBatteryOptimizations(packageName: String?, promise: Promise) {
    try {
      val context = reactApplicationContext
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        promise.resolve("unsupported")
        return
      }
      val target = packageName?.takeIf { it.isNotBlank() } ?: context.packageName
      val powerManager = context.getSystemService(PowerManager::class.java)
      if (powerManager?.isIgnoringBatteryOptimizations(target) == true) {
        promise.resolve("already_ignored")
        return
      }

      val requestIntent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:$target")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        context.startActivity(requestIntent)
        promise.resolve("dialog_opened")
        return
      } catch (_: Exception) {
        // Fall through to settings page
      }

      val settingsIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      try {
        context.startActivity(settingsIntent)
        promise.resolve("settings_opened")
      } catch (_: Exception) {
        promise.resolve("unsupported")
      }
    } catch (_: Exception) {
      promise.resolve("unsupported")
    }
  }

  @ReactMethod
  fun openBatteryOptimizationSettings(promise: Promise) {
    try {
      val context = reactApplicationContext
      val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      promise.resolve("settings_opened")
    } catch (_: Exception) {
      promise.resolve("unsupported")
    }
  }
}
