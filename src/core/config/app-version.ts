import * as Application from "expo-application"

import { isPreviewReleaseVersion } from "./version-compare"

export { isPreviewReleaseVersion }

const DEV_VERSION_PATTERN = /-dev(?:\.\d+)?$/i

export function getCurrentAppVersion() {
  return Application.nativeApplicationVersion || ""
}

export function isDevBuild(version: string = getCurrentAppVersion()) {
  return DEV_VERSION_PATTERN.test(version)
}
