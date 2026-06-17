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
import {
  getCurrentAppVersion,
  isPreviewReleaseVersion,
} from "@/modules/updates/app-version"

export { getCurrentAppVersion, isPreviewReleaseVersion }

const GITHUB_RELEASES_URL =
  "https://api.github.com/repos/abdrhmniqbal/startune-music/releases"
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

export interface AppReleaseNote {
  version: string
  releaseName: string
  body: string
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

function normalizeVersion(value: string) {
  return value.trim().replace(/^[^0-9]+/, "")
}

function parseVersion(value: string) {
  const [main = "", prerelease = ""] = normalizeVersion(value).split("-", 2)
  const mainParts = main
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0))
  const prereleaseParts = prerelease.length > 0 ? prerelease.split(".") : []

  return {
    mainParts,
    prereleaseParts,
  }
}

function comparePrereleasePart(left: string, right: string) {
  const leftNumber = Number.parseInt(left, 10)
  const rightNumber = Number.parseInt(right, 10)
  const leftIsNumber = Number.isFinite(leftNumber) && `${leftNumber}` === left
  const rightIsNumber = Number.isFinite(rightNumber) && `${rightNumber}` === right

  if (leftIsNumber && rightIsNumber) {
    return leftNumber - rightNumber
  }

  if (leftIsNumber) {
    return -1
  }

  if (rightIsNumber) {
    return 1
  }

  return left.localeCompare(right)
}

function compareVersions(left: string, right: string) {
  const leftVersion = parseVersion(left)
  const rightVersion = parseVersion(right)
  const maxLength = Math.max(
    leftVersion.mainParts.length,
    rightVersion.mainParts.length
  )

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftVersion.mainParts[index] ?? 0
    const rightPart = rightVersion.mainParts[index] ?? 0
    if (leftPart !== rightPart) {
      return leftPart - rightPart
    }
  }

  if (
    leftVersion.prereleaseParts.length === 0 &&
    rightVersion.prereleaseParts.length === 0
  ) {
    return 0
  }

  if (leftVersion.prereleaseParts.length === 0) {
    return 1
  }

  if (rightVersion.prereleaseParts.length === 0) {
    return -1
  }

  const prereleaseMaxLength = Math.max(
    leftVersion.prereleaseParts.length,
    rightVersion.prereleaseParts.length
  )

  for (let index = 0; index < prereleaseMaxLength; index += 1) {
    const leftPart = leftVersion.prereleaseParts[index]
    const rightPart = rightVersion.prereleaseParts[index]
    if (leftPart === undefined) {
      return -1
    }
    if (rightPart === undefined) {
      return 1
    }

    const comparison = comparePrereleasePart(leftPart, rightPart)
    if (comparison !== 0) {
      return comparison
    }
  }

  return 0
}

function isNewerVersion(candidate: string, current: string) {
  return compareVersions(candidate, current) > 0
}

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function getReleaseVersion(release: GitHubRelease) {
  return asString(release.tag_name)
}

function compareGitHubReleases(left: GitHubRelease, right: GitHubRelease) {
  const versionComparison = compareVersions(
    asString(right.tag_name),
    asString(left.tag_name)
  )

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
  const assets = Array.isArray(release.assets)
    ? (release.assets as GitHubReleaseAsset[])
    : []
  const apkAsset = assets.find((asset) => {
    const name = asString(asset.name)
    const url = asString(asset.browser_download_url)
    return APK_ASSET_PATTERN.test(name) || APK_ASSET_PATTERN.test(url)
  })

  return asString(apkAsset?.browser_download_url) || asString(release.html_url)
}

function toUpdateInfo(
  release: GitHubRelease,
  currentVersion: string
): AppUpdateInfo | null {
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

function parseChangelogReleaseNotes(markdown: string, currentVersion: string) {
  const headingPattern = /^##\s+\[([^\]]+)\](?:\s+-\s+([^\n]+))?\s*$/gm
  const matches: Array<{
    headingStart: number
    headingLength: number
    version: string
  }> = []

  let match: RegExpExecArray | null
  while ((match = headingPattern.exec(markdown)) !== null) {
    matches.push({
      headingStart: match.index,
      headingLength: match[0]?.length ?? 0,
      version: (match[1] ?? "").trim(),
    })
  }

  return matches
    .map((entry, index) => {
      const bodyStart = entry.headingStart + entry.headingLength
      const bodyEnd =
        index < matches.length - 1
          ? (matches[index + 1]?.headingStart ?? markdown.length)
          : markdown.length
      const body = markdown.slice(bodyStart, bodyEnd).trim()
      const version = entry.version

      if (version.length === 0 || compareVersions(version, currentVersion) > 0) {
        return null
      }

      return {
        version,
        releaseName: version,
        body,
        prerelease: normalizeVersion(version).includes("-"),
      } satisfies AppReleaseNote
    })
    .filter((release): release is AppReleaseNote => release !== null)
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
  if (
    !currentVersion ||
    (skipWhenNotificationsDisabled && !settings.notificationsEnabled)
  ) {
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

  await Notifications.setNotificationChannelAsync(
    UPDATE_NOTIFICATION_CHANNEL_ID,
    {
      name: i18n.t("updates.notification.channelName"),
      description: i18n.t("updates.notification.channelDescription"),
      importance: Notifications.AndroidImportance.DEFAULT,
    }
  )
  notificationsConfigured = true
}

export async function notifyAppUpdateAvailable(
  update: AppUpdateInfo,
  settings: AppUpdateConfig
) {
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
      trigger:
        Platform.OS === "android"
          ? { channelId: UPDATE_NOTIFICATION_CHANNEL_ID }
          : null,
    })

    await setAppUpdateConfig({ lastNotifiedVersion: update.newVersion })
    logInfo("App update notification scheduled", {
      version: update.newVersion,
    })
  } catch (error) {
    logError("Failed to schedule app update notification", error)
  }
}
