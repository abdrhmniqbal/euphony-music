import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import { i18n } from "@/core/localization/i18n"
import { isRecord, isString } from "@/lib/guards"
import { logError, logInfo } from "@/core/log/service"
import { preferenceStore } from "@/core/preferences/store"
import type { AppUpdateConfig } from "@/core/preferences/types"
import { getCurrentAppVersion, isPreviewReleaseVersion } from "@/core/config/app-version"
import {
  compareVersions,
  isNewerVersion,
  type AppReleaseNote,
} from "@/core/config/version-compare"

export { getCurrentAppVersion, isPreviewReleaseVersion }
export type { AppReleaseNote } from "@/core/config/version-compare"

const GITHUB_RELEASES_URL = "https://api.github.com/repos/abdrhmniqbal/startune-music/releases"
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

function getReleaseVersion(release: GitHubRelease) {
  return isString(release.tag_name) ? release.tag_name : ""
}

function getReleaseName(release: GitHubRelease) {
  return isString(release.name) ? release.name : ""
}

function compareGitHubReleases(left: GitHubRelease, right: GitHubRelease) {
  const versionComparison = compareVersions(getReleaseVersion(right), getReleaseVersion(left))

  if (versionComparison !== 0) {
    return versionComparison
  }

  const leftPublishedAt = Date.parse(isString(left.published_at) ? left.published_at : "")
  const rightPublishedAt = Date.parse(isString(right.published_at) ? right.published_at : "")

  if (Number.isFinite(leftPublishedAt) && Number.isFinite(rightPublishedAt)) {
    return rightPublishedAt - leftPublishedAt
  }

  return getReleaseName(right).localeCompare(getReleaseName(left))
}

function getSortedGitHubReleases(releases: GitHubRelease[]) {
  return [...releases].sort(compareGitHubReleases)
}

function resolveReleaseDownloadUrl(release: GitHubRelease) {
  const assets = Array.isArray(release.assets) ? release.assets : []
  const apkAsset = assets.find((asset) => {
    if (!isRecord(asset)) {
      return false
    }
    const name = isString(asset.name) ? asset.name : ""
    const url = isString(asset.browser_download_url) ? asset.browser_download_url : ""
    return APK_ASSET_PATTERN.test(name) || APK_ASSET_PATTERN.test(url)
  })

  const apkDownloadUrl =
    isRecord(apkAsset) && isString(apkAsset.browser_download_url)
      ? apkAsset.browser_download_url
      : ""

  return apkDownloadUrl || (isString(release.html_url) ? release.html_url : "")
}

function toUpdateInfo(release: GitHubRelease, currentVersion: string): AppUpdateInfo | null {
  const tagName = getReleaseVersion(release)
  if (!tagName || !isNewerVersion(tagName, currentVersion)) {
    return null
  }

  return {
    currentVersion,
    newVersion: tagName,
    releaseName: getReleaseName(release) || tagName,
    body: isString(release.body) ? release.body : "",
    htmlUrl: isString(release.html_url) ? release.html_url : "",
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

  const parsed = await response.json()
  return Array.isArray(parsed) ? parsed.filter(isRecord) : []
}

export async function getGitHubReleaseNotesUntilCurrent({
  currentVersion,
}: {
  currentVersion: string
}): Promise<AppReleaseNote[]> {
  if (!currentVersion) {
    return []
  }

  try {
    const releases = await fetchGitHubReleases()
    return releases
      .filter((release) => release.draft !== true && isString(release.tag_name))
      .map((release) => ({
        version: getReleaseVersion(release),
        releaseName: getReleaseName(release) || getReleaseVersion(release),
        body: isString(release.body) ? release.body : "",
        prerelease: release.prerelease === true,
      }))
      .filter(
        (note) => note.version.length > 0 && compareVersions(note.version, currentVersion) <= 0
      )
      .sort((left, right) => compareVersions(right.version, left.version))
  } catch (error) {
    logError("Failed to load release notes", error)
    return []
  }
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
  if (
    !settings.notificationsEnabled ||
    settings.lastNotifiedVersion === update.newVersion
  ) {
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

    const current = preferenceStore.getState().appUpdateConfig
    preferenceStore.setState({
      appUpdateConfig: { ...current, lastNotifiedVersion: update.newVersion },
    })
    logInfo("App update notification scheduled", {
      version: update.newVersion,
    })
  } catch (error) {
    logError("Failed to schedule app update notification", error)
  }
}
