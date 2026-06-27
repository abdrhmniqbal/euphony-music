/**
 * Purpose: Resolves the installed app version and preview-release status.
 * Caller: App update settings, update checker service, and update-related screens.
 * Dependencies: Expo Application metadata.
 * Main Functions: getCurrentAppVersion(), isPreviewReleaseVersion()
 * Side Effects: None.
 */

import * as Application from "expo-application"

import { isPreviewReleaseVersion } from "./version-compare"

export { isPreviewReleaseVersion }

export function getCurrentAppVersion() {
  return Application.nativeApplicationVersion || ""
}
