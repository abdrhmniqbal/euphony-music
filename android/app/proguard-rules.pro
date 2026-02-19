# Keep useful crash stack metadata.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-keepattributes Signature,*Annotation*

# React Native bridge / native modules.
-keep class com.facebook.react.bridge.** { *; }
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }

# Expo modules (reflection-heavy registration path).
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# New architecture / UI manager.
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.animated.** { *; }
-keep class com.facebook.react.common.** { *; }

# Common React Native native dependencies.
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-dontwarn com.swmansion.**
-keep class com.horcrux.svg.** { *; }
-keep class com.doublesymmetry.trackplayer.** { *; }
-dontwarn com.doublesymmetry.trackplayer.**
-keep class com.shopify.reactnative.skia.** { *; }

# Network stack warnings.
-dontwarn okhttp3.**
-dontwarn okio.**
