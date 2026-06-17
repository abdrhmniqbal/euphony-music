/**
 * Purpose: Starts one global notification-response runtime and forwards route intents through injected navigation callbacks.
 * Caller: Root layout.
 * Dependencies: Expo notifications and notification action helpers.
 * Main Functions: ensureNotificationRuntimeStarted(), setNotificationRouteHandler()
 * Side Effects: Registers one global notification response listener and may navigate or trigger indexer actions.
 */

import * as Notifications from "expo-notifications"

import {
  getNotificationRoute,
  handleNotificationAction,
} from "@/modules/notifications/notification-actions"

let hasStartedNotificationRuntime = false
let handledNotificationResponseKey: string | null = null
let routeHandler: ((route: string) => void) | null = null

function buildNotificationResponseKey(response: Notifications.NotificationResponse) {
  const responseTitle = response.notification.request.content.title ?? ""
  const responseBody = response.notification.request.content.body ?? ""

  return [
    response.notification.request.identifier,
    response.actionIdentifier,
    response.notification.date,
    responseTitle,
    responseBody,
  ].join(":")
}

function handleNotificationResponse(response: Notifications.NotificationResponse | null) {
  if (!response) {
    return
  }

  const responseKey = buildNotificationResponseKey(response)
  if (handledNotificationResponseKey === responseKey) {
    return
  }

  handledNotificationResponseKey = responseKey

  if (handleNotificationAction(response)) {
    return
  }

  const route = getNotificationRoute(response)
  if (!route) {
    return
  }

  routeHandler?.(route)
}

export function setNotificationRouteHandler(handler: ((route: string) => void) | null) {
  routeHandler = handler
}

export function ensureNotificationRuntimeStarted() {
  if (hasStartedNotificationRuntime) {
    return
  }

  hasStartedNotificationRuntime = true
  void Notifications.getLastNotificationResponseAsync().then(handleNotificationResponse)
  Notifications.addNotificationResponseReceivedListener(handleNotificationResponse)
}
