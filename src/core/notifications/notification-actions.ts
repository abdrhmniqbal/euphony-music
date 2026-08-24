import * as Notifications from "expo-notifications"

import {
  INDEXER_NOTIFICATION_ACTION_CANCEL,
  INDEXER_NOTIFICATION_ACTION_PAUSE,
  INDEXER_NOTIFICATION_ACTION_RESUME,
} from "@/domains/indexer/progress/notification"
import { cancelIndexing, pauseIndexing, resumeIndexing } from "@/domains/indexer/service"
import { openLatestAppUpdatePrompt } from "@/domains/updates/app-update-runtime"
import { isNonEmptyString } from "@/lib/guards"

interface IndexerNotificationActions {
  [actionId: string]: () => void
}

const INDEXER_ACTIONS: IndexerNotificationActions = {
  [INDEXER_NOTIFICATION_ACTION_PAUSE]: pauseIndexing,
  [INDEXER_NOTIFICATION_ACTION_RESUME]: resumeIndexing,
  [INDEXER_NOTIFICATION_ACTION_CANCEL]: cancelIndexing,
}

export function handleNotificationAction(response: Notifications.NotificationResponse): boolean {
  // SAFETY: notification data originates from our own scheduled payloads; both keys are optional
  const { source } = (response.notification.request.content.data ?? {}) as {
    source?: string
    route?: string
  }
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
  if (!isNonEmptyString(route)) {
    return null
  }

  return route
}
