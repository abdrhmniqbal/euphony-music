/**
 * Purpose: Checks GitHub releases for newer app versions and schedules update notifications.
 * Caller: App update prompt runtime.
 * Dependencies: Expo notifications runtime, settings app-update config, localization, logging, app version metadata.
 * Main Functions: checkForAppUpdate(), getChangelogReleaseNotesUntilCurrent(), notifyAppUpdateAvailable(), getCurrentAppVersion().
 * Side Effects: Performs GitHub API fetches, requests notification permission, schedules OS notifications.
 */

import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import { i18n } from "@/modules/localization/i18n"
import { logError, logInfo } from "@/modules/logging/service"
import { setAppUpdateConfig } from "@/modules/settings/app-updates"
import type { AppUpdateConfig } from "@/modules/settings/types"
import { getCurrentAppVersion, isPreviewReleaseVersion } from "@/modules/updates/app-version"
import {
  compareVersions,
  isNewerVersion,
  parseChangelogReleaseNotes,
  type AppReleaseNote,
} from "./version-compare"

export { getCurrentAppVersion, isPreviewReleaseVersion }
export type { AppReleaseNote } from "./version-compare"

const GITHUB_RELEASES_URL = "https://api.github.com/repos/abdrhmniqbal/startune-music/releases"
const CHANGELOG_RAW_URL =
  "https://raw.githubusercontent.com/abdrhmniqbal/startune-music/master/CHANGELOG.md"
const UPDATE_NOTIFICATION_CHANNEL_ID = "app-updates"
const UPDATE_NOTIFICATION_ID = "app-update-available"
const APK_ASSET_PATTERN = /\.apk$/i

let notificationsConfigured = false

export interface AppUpdateInfo {
  currentVersion: string
  newVersion: string
  releaseName: string
  body: string
  htmlUrl: string
  downloadUrl: string
  prerelease: boolean
}

interface GitHubReleaseAsset {
  browser_download_url?: unknown
  name?: unknown
}

interface GitHubRelease {
  tag_name?: unknown
  name?: unknown
  body?: unknown
  html_url?: unknown
  draft?: unknown
  prerelease?: unknown
  assets?: unknown
  published_at?: unknown
}

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function getReleaseVersion(release: GitHubRelease) {
  return asString(release.tag_name)
}

function compareGitHubReleases(left: GitHubRelease, right: GitHubRelease) {
  const versionComparison = compareVersions(asString(right.tag_name), asString(left.tag_name))

  if (versionComparison !== 0) {
    return versionComparison
  }

  const leftPublishedAt = Date.parse(asString(left.published_at))
  const rightPublishedAt = Date.parse(asString(right.published_at))

  if (Number.isFinite(leftPublishedAt) && Number.isFinite(rightPublishedAt)) {
    return rightPublishedAt - leftPublishedAt
  }

  return asString(right.name).localeCompare(asString(left.name))
}

function getSortedGitHubReleases(releases: GitHubRelease[]) {
  return [...releases].sort(compareGitHubReleases)
}

function resolveReleaseDownloadUrl(release: GitHubRelease) {
  const assets = Array.isArray(release.assets) ? (release.assets as GitHubReleaseAsset[]) : []
  const apkAsset = assets.find((asset) => {
    const name = asString(asset.name)
    const url = asString(asset.browser_download_url)
    return APK_ASSET_PATTERN.test(name) || APK_ASSET_PATTERN.test(url)
  })

  return asString(apkAsset?.browser_download_url) || asString(release.html_url)
}

function toUpdateInfo(release: GitHubRelease, currentVersion: string): AppUpdateInfo | null {
  const tagName = asString(release.tag_name)
  if (!tagName || !isNewerVersion(tagName, currentVersion)) {
    return null
  }

  return {
    currentVersion,
    newVersion: tagName,
    releaseName: asString(release.name) || tagName,
    body: asString(release.body),
    htmlUrl: asString(release.html_url),
    downloadUrl: resolveReleaseDownloadUrl(release),
    prerelease: release.prerelease === true,
  }
}

async function fetchGitHubReleases(): Promise<GitHubRelease[]> {
  const response = await fetch(GITHUB_RELEASES_URL, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub releases request failed: ${response.status}`)
  }

  const parsed = (await response.json()) as unknown
  return Array.isArray(parsed) ? (parsed as GitHubRelease[]) : []
}

async function fetchRepositoryChangelog(): Promise<string> {
  const response = await fetch(CHANGELOG_RAW_URL, {
    headers: {
      Accept: "text/plain",
    },
  })

  if (!response.ok) {
    throw new Error(`Repository changelog request failed: ${response.status}`)
  }

  return await response.text()
}

export async function checkForAppUpdate({
  currentVersion,
  settings,
  skipWhenNotificationsDisabled = false,
  throwOnError = false,
}: {
  currentVersion: string
  settings: AppUpdateConfig
  skipWhenNotificationsDisabled?: boolean
  throwOnError?: boolean
}): Promise<AppUpdateInfo | null> {
  if (!currentVersion || (skipWhenNotificationsDisabled && !settings.notificationsEnabled)) {
    return null
  }

  try {
    const releases = getSortedGitHubReleases(await fetchGitHubReleases())
    const eligibleReleases = releases.filter((candidate) => {
      if (candidate.draft === true) {
        return false
      }

      if (candidate.prerelease === true && !settings.includePrereleases) {
        return false
      }

      return isNewerVersion(getReleaseVersion(candidate), currentVersion)
    })

    const release = eligibleReleases.reduce<GitHubRelease | null>(
      (latestRelease, candidateRelease) => {
        if (latestRelease === null) {
          return candidateRelease
        }

        return compareVersions(
          getReleaseVersion(candidateRelease),
          getReleaseVersion(latestRelease)
        ) > 0
          ? candidateRelease
          : latestRelease
      },
      null
    )

    return release ? toUpdateInfo(release, currentVersion) : null
  } catch (error) {
    logError("Failed to check app updates", error)
    if (throwOnError) {
      throw error
    }
    return null
  }
}

export async function getChangelogReleaseNotesUntilCurrent({
  currentVersion,
}: {
  currentVersion: string
}): Promise<AppReleaseNote[]> {
  if (!currentVersion) {
    return []
  }

  try {
    const changelogMarkdown = await fetchRepositoryChangelog()
    return parseChangelogReleaseNotes(changelogMarkdown, currentVersion)
  } catch (error) {
    logError("Failed to load release notes", error)
    return []
  }
}

async function ensureNotificationPermission() {
  const existingPermissions = await Notifications.getPermissionsAsync()
  if (existingPermissions.granted) {
    return true
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync()
  return requestedPermissions.granted
}

async function ensureUpdateNotificationChannel() {
  if (notificationsConfigured) {
    return
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })

  if (Platform.OS !== "android") {
    notificationsConfigured = true
    return
  }

  await Notifications.setNotificationChannelAsync(UPDATE_NOTIFICATION_CHANNEL_ID, {
    name: i18n.t("updates.notification.channelName"),
    description: i18n.t("updates.notification.channelDescription"),
    importance: Notifications.AndroidImportance.DEFAULT,
  })
  notificationsConfigured = true
}

export async function notifyAppUpdateAvailable(update: AppUpdateInfo, settings: AppUpdateConfig) {
  if (!settings.notificationsEnabled || settings.lastNotifiedVersion === update.newVersion) {
    return
  }

  try {
    await ensureUpdateNotificationChannel()
    if (!(await ensureNotificationPermission())) {
      return
    }

    await Notifications.scheduleNotificationAsync({
      identifier: UPDATE_NOTIFICATION_ID,
      content: {
        title: i18n.t("updates.notification.title"),
        body: i18n.t("updates.notification.body", {
          currentVersion: update.currentVersion,
          newVersion: update.newVersion,
        }),
        data: {
          source: "app-update",
          version: update.newVersion,
        },
      },
      trigger: Platform.OS === "android" ? { channelId: UPDATE_NOTIFICATION_CHANNEL_ID } : null,
    })

    await setAppUpdateConfig({ lastNotifiedVersion: update.newVersion })
    logInfo("App update notification scheduled", {
      version: update.newVersion,
    })
  } catch (error) {
    logError("Failed to schedule app update notification", error)
  }
}
