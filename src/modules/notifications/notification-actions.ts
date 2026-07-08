/**
 * Purpose: Resolves notification response intents into indexer actions, update prompts, or app routes.
 * Caller: Notification runtime.
 * Dependencies: Expo notifications constants, indexer services, and update prompt runtime.
 * Main Functions: handleNotificationAction(), getNotificationRoute()
 * Side Effects: May pause, resume, or cancel indexing, or open the update prompt.
 */

import * as Notifications from "expo-notifications"

import {
  INDEXER_NOTIFICATION_ACTION_CANCEL,
  INDEXER_NOTIFICATION_ACTION_PAUSE,
  INDEXER_NOTIFICATION_ACTION_RESUME,
} from "@/modules/indexer/notification"
import { cancelIndexing, pauseIndexing, resumeIndexing } from "@/modules/indexer/service"
import { openLatestAppUpdatePrompt } from "@/modules/updates/app-update-runtime"

const INDEXER_ACTIONS: Record<string, () => void> = {
  [INDEXER_NOTIFICATION_ACTION_PAUSE]: pauseIndexing,
  [INDEXER_NOTIFICATION_ACTION_RESUME]: resumeIndexing,
  [INDEXER_NOTIFICATION_ACTION_CANCEL]: cancelIndexing,
}

export function handleNotificationAction(response: Notifications.NotificationResponse): boolean {
  const { source } = response.notification.request.content.data ?? {}
  const action = response.actionIdentifier

  if (source === "app-update") {
    if (action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      void openLatestAppUpdatePrompt()
    }
    return true
  }

  if (source !== "indexer-progress") {
    return false
  }

  // A default tap on an indexer notification has no action button; let it route.
  if (action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return false
  }

  const indexerAction = INDEXER_ACTIONS[action]
  if (indexerAction) {
    indexerAction()
  }
  return true
}

export function getNotificationRoute(response: Notifications.NotificationResponse) {
  const route = response.notification.request.content.data?.route
  if (typeof route !== "string" || route.length === 0) {
    return null
  }

  return route
}
