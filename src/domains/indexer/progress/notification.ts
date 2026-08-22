/**
 * Purpose: Manages Android/iOS progress notifications for active library indexing runs
 * Caller: indexer.service and notification response bootstrap handlers
 * Dependencies: expo-notifications, react-native Platform, localization, logging, indexer notification settings
 * Main Functions: beginIndexerProgressNotification(), updateIndexerProgressNotification(), completeIndexerProgressNotification(), failIndexerProgressNotification(), pauseIndexerProgressNotification(), resumeIndexerProgressNotification(), dismissIndexerProgressNotification()
 * Side Effects: Requests notification permissions, configures Android channels/categories, schedules and dismisses OS notifications
 */

import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

import type { IndexerScanProgress } from "../state/types"
import { i18n } from "@/core/localization/i18n"
import { logError, logInfo } from "@/core/log/service"
import { getPreferenceState } from "@/core/preferences/store"

const INDEXER_NOTIFICATION_CHANNEL_ID = "indexer-progress"
const INDEXER_NOTIFICATION_ROUTE = "/(main)/(library)"
const INDEXER_NOTIFICATION_ID = "indexer-progress-active"
const INDEXER_NOTIFICATION_ACTIVE_CATEGORY_ID = "indexer-progress-active-actions"
const INDEXER_NOTIFICATION_PAUSED_CATEGORY_ID = "indexer-progress-paused-actions"

export const INDEXER_NOTIFICATION_ACTION_PAUSE = "INDEXER_NOTIFICATION_ACTION_PAUSE"
export const INDEXER_NOTIFICATION_ACTION_RESUME = "INDEXER_NOTIFICATION_ACTION_RESUME"
export const INDEXER_NOTIFICATION_ACTION_CANCEL = "INDEXER_NOTIFICATION_ACTION_CANCEL"

let notificationsConfigured = false
let permissionResolved = false
let notificationsGranted = false
let permissionRequestedThisSession = false
let activeNotificationId: string | null = null
let lastNotificationSignature: string | null = null
let currentIndexerRunStartedAt: number | null = null
let latestNotificationRequestVersion = 0

function isIndexerNotification(notification: Notifications.Notification) {
  const payload = notification.request.content.data as { source?: unknown } | undefined
  return payload?.source === "indexer-progress"
}

async function dismissPresentedIndexerNotifications(options?: { keepId?: string | null }) {
  const keepId = options?.keepId ?? null
  try {
    const presented = await Notifications.getPresentedNotificationsAsync()
    const pendingDismissals = presented
      .filter(isIndexerNotification)
      .filter((notification) => notification.request.identifier !== keepId)
      .map((notification) =>
        Notifications.dismissNotificationAsync(notification.request.identifier)
      )

    if (pendingDismissals.length > 0) {
      await Promise.allSettled(pendingDismissals)
    }
  } catch (error) {
    logError("Failed to dismiss presented indexer notifications", error)
  }
}

function formatElapsedMs(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) {
    return `${seconds}s`
  }

  return `${minutes}m ${seconds}s`
}

function getElapsedLabel() {
  if (currentIndexerRunStartedAt === null) {
    return "0s"
  }

  return formatElapsedMs(Date.now() - currentIndexerRunStartedAt)
}

function formatProgressBody(progress: IndexerScanProgress) {
  const fileName = progress.currentFile || i18n.t("indexing.preparing")
  if (progress.total <= 0) {
    return `${getElapsedLabel()} • ${fileName}`
  }

  const percent = Math.min(100, Math.max(0, Math.round((progress.current / progress.total) * 100)))
  return `${progress.current}/${progress.total} • ${percent}% • ${getElapsedLabel()} • ${fileName}`
}

async function configureNotifications() {
  if (notificationsConfigured) {
    return
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: true,
    }),
  })

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(INDEXER_NOTIFICATION_CHANNEL_ID, {
      name: i18n.t("indexing.notification.channelName"),
      description: i18n.t("indexing.notification.channelDescription"),
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0],
      enableVibrate: false,
      sound: null,
    })
  }

  await Notifications.setNotificationCategoryAsync(INDEXER_NOTIFICATION_ACTIVE_CATEGORY_ID, [
    {
      identifier: INDEXER_NOTIFICATION_ACTION_PAUSE,
      buttonTitle: i18n.t("indexing.notification.pause"),
    },
    {
      identifier: INDEXER_NOTIFICATION_ACTION_CANCEL,
      buttonTitle: i18n.t("indexing.notification.cancel"),
      options: {
        isDestructive: true,
      },
    },
  ])

  await Notifications.setNotificationCategoryAsync(INDEXER_NOTIFICATION_PAUSED_CATEGORY_ID, [
    {
      identifier: INDEXER_NOTIFICATION_ACTION_RESUME,
      buttonTitle: i18n.t("indexing.notification.resume"),
    },
    {
      identifier: INDEXER_NOTIFICATION_ACTION_CANCEL,
      buttonTitle: i18n.t("indexing.notification.cancel"),
      options: {
        isDestructive: true,
      },
    },
  ])

  notificationsConfigured = true
}

async function ensureNotificationPermission() {
  await configureNotifications()

  if (permissionResolved) {
    return notificationsGranted
  }

  const existingPermissions = await Notifications.getPermissionsAsync()
  if (existingPermissions.granted) {
    permissionResolved = true
    notificationsGranted = true
    return true
  }

  if (!permissionRequestedThisSession) {
    permissionRequestedThisSession = true
    const requestedPermissions = await Notifications.requestPermissionsAsync()
    if (requestedPermissions.granted) {
      permissionResolved = true
      notificationsGranted = true
      logInfo("Notification permission granted for indexer progress")
      return true
    }
  }

  permissionResolved = true
  notificationsGranted = false
  logInfo("Notification permission denied for indexer progress")
  return false
}

async function replaceIndexerNotification(
  title: string,
  body: string,
  requestVersion: number,
  options?: {
    autoDismiss?: boolean
    paused?: boolean
    interactive?: boolean
    sticky?: boolean
  }
) {
  const notificationsEnabled = getPreferenceState().indexerNotificationsEnabled
  if (requestVersion < latestNotificationRequestVersion) {
    return
  }

  if (!notificationsEnabled) {
    await dismissPresentedIndexerNotifications()
    if (activeNotificationId) {
      try {
        await Notifications.dismissNotificationAsync(INDEXER_NOTIFICATION_ID)
      } catch (error) {
        logError("Failed to dismiss indexer notification while disabled", error)
      } finally {
        activeNotificationId = null
        lastNotificationSignature = null
      }
    }

    return
  }

  if (!(await ensureNotificationPermission())) {
    return
  }

  if (requestVersion < latestNotificationRequestVersion) {
    return
  }

  try {
    const paused = options?.paused ?? false
    const interactive = options?.interactive ?? false
    const sticky = options?.sticky ?? interactive
    const autoDismiss = options?.autoDismiss ?? !sticky
    const categoryIdentifier = interactive
      ? paused
        ? INDEXER_NOTIFICATION_PAUSED_CATEGORY_ID
        : INDEXER_NOTIFICATION_ACTIVE_CATEGORY_ID
      : undefined
    const signature = `${title}\n${body}`
    if (activeNotificationId && lastNotificationSignature === signature) {
      return
    }

    if (!activeNotificationId) {
      await dismissPresentedIndexerNotifications({ keepId: INDEXER_NOTIFICATION_ID })
    }

    await Notifications.scheduleNotificationAsync({
      identifier: INDEXER_NOTIFICATION_ID,
      content: {
        title,
        body,
        sound: false,
        sticky,
        autoDismiss,
        categoryIdentifier,
        data: {
          source: "indexer-progress",
          route: INDEXER_NOTIFICATION_ROUTE,
          paused,
        },
      },
      trigger: Platform.OS === "android" ? { channelId: INDEXER_NOTIFICATION_CHANNEL_ID } : null,
    })
    activeNotificationId = INDEXER_NOTIFICATION_ID
    lastNotificationSignature = signature
  } catch (error) {
    logError("Failed to update indexer progress notification", error)
  }
}

export async function beginIndexerProgressNotification() {
  currentIndexerRunStartedAt = Date.now()
  const requestVersion = ++latestNotificationRequestVersion
  await replaceIndexerNotification(
    i18n.t("indexing.notification.indexingLibrary"),
    `${i18n.t("indexing.notification.preparingScan")} • ${getElapsedLabel()}`,
    requestVersion,
    { interactive: true }
  )
}

export async function updateIndexerProgressNotification(progress: IndexerScanProgress) {
  const requestVersion = ++latestNotificationRequestVersion
  const title =
    progress.phase === "scanning"
      ? i18n.t("indexing.notification.scanningFiles")
      : i18n.t("indexing.notification.processingMetadata")

  await replaceIndexerNotification(title, formatProgressBody(progress), requestVersion, {
    interactive: true,
  })
}

export async function completeIndexerProgressNotification(totalFiles: number) {
  const requestVersion = ++latestNotificationRequestVersion
  await replaceIndexerNotification(
    i18n.t("indexing.notification.complete"),
    `${i18n.t("indexing.notification.tracksUpdated", { count: totalFiles })} • ${getElapsedLabel()}`,
    requestVersion,
    { autoDismiss: true, interactive: false, sticky: false }
  )
}

export async function failIndexerProgressNotification() {
  const requestVersion = ++latestNotificationRequestVersion
  await replaceIndexerNotification(
    i18n.t("indexing.notification.failed"),
    i18n.t("indexing.notification.tapToReopen"),
    requestVersion,
    { autoDismiss: true, interactive: false, sticky: false }
  )
}

export async function pauseIndexerProgressNotification(progress: {
  current: number
  total: number
  currentFile: string
}) {
  const requestVersion = ++latestNotificationRequestVersion
  const body =
    progress.total > 0
      ? `${progress.current}/${progress.total} • ${i18n.t("indexing.paused")}`
      : i18n.t("indexing.paused")

  await replaceIndexerNotification(i18n.t("indexing.notification.paused"), body, requestVersion, {
    paused: true,
    interactive: true,
  })
}

export async function resumeIndexerProgressNotification(progress: IndexerScanProgress) {
  const requestVersion = ++latestNotificationRequestVersion
  await replaceIndexerNotification(
    progress.phase === "scanning"
      ? i18n.t("indexing.notification.scanningFiles")
      : i18n.t("indexing.notification.processingMetadata"),
    formatProgressBody(progress),
    requestVersion,
    {
      paused: false,
      interactive: true,
    }
  )
}

export async function dismissIndexerProgressNotification() {
  ++latestNotificationRequestVersion
  try {
    await Notifications.dismissNotificationAsync(INDEXER_NOTIFICATION_ID)
  } catch (error) {
    logError("Failed to dismiss indexer progress notification", error)
  } finally {
    await dismissPresentedIndexerNotifications()
    activeNotificationId = null
    lastNotificationSignature = null
    currentIndexerRunStartedAt = null
  }
}
