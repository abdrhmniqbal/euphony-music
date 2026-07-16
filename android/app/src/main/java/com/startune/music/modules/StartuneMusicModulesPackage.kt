package com.startune.music.modules

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.startune.music.modules.appupdater.AppUpdaterModule
import com.startune.music.modules.batteryoptimization.BatteryOptimizationModule

class StartuneMusicModulesPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(
      BatteryOptimizationModule(reactContext),
      AppUpdaterModule(reactContext)
    )
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
