// Copyright (C) 2024 - present, Startune
// SPDX-License-Identifier: AGPL-3.0-only

import type { ExpoConfig } from "expo/config"

const { version: pkgVersion } = require("./package.json")

const APP_VARIANT = process.env.APP_VARIANT ?? "production"

const IS_DEV = APP_VARIANT === "dev"

export default (): ExpoConfig => ({
  name: IS_DEV ? "Startune Music Dev" : "Startune Music",
  slug: "startune-music",
  scheme: "startune-music",
  version: pkgVersion,
  orientation: "default",
  userInterfaceStyle: "automatic",
  icon: "./src/assets/icon.png",
  backgroundColor: "#000000",
  experiments: {
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "64a42f10-dd59-47dd-8cbb-bcd10cc4139b",
    },
  },
  web: {
    output: "static",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.startune.music",
    infoPlist: {
      UIBackgroundModes: ["audio"],
    },
  },
  android: {
    package: IS_DEV ? "com.startune.music.dev" : "com.startune.music",
    adaptiveIcon: {
      foregroundImage: "./src/assets/icon.png",
      backgroundColor: "#000000",
    },
    permissions: [
      "INTERNET",
      "WAKE_LOCK",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_AUDIO_PLAYBACK",
      "POST_NOTIFICATIONS",
      "REQUEST_INSTALL_PACKAGES",
      "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
    ],
    intentFilters: [
      {
        action: "VIEW",
        category: ["DEFAULT"],
        data: [
          { scheme: "content", mimeType: "audio/*" },
          { scheme: "file", mimeType: "audio/*" },
        ],
      },
    ],
  },
  plugins: [
    "expo-router",
    "expo-media-library",
    [
      "expo-notifications",
      {
        icon: "./src/assets/notification-icon.png",
        color: "#FFFFFF",
      },
    ],
    "@zoontek/react-native-navigation-bar",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0088F6",
        image: "./src/assets/splash-icon.png",
        dark: {
          image: "./src/assets/splash-icon.png",
          backgroundColor: "#09090b",
        },
        resizeMode: "contain",
      },
    ],
    [
      "react-native-file-viewer-turbo",
      {
        mimeTypes: ["*/*"],
      },
    ],
    "react-native-google-cast",
    "expo-localization",
    "@react-native-community/datetimepicker",
    "expo-sqlite",
    [
      "expo-build-properties",
      {
        android: {
          kotlinJvmTarget: "17",
          enableBundleCompression: true,
          enableMinifyInReleaseBuilds: IS_DEV ? false : true,
          enableShrinkResourcesInReleaseBuilds: IS_DEV ? false : true,
        },
      },
    ],
    "./plugins/with-startune-modules.js",
  ],
})
