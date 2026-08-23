import * as Notifications from "expo-notifications"

import {
  getNotificationRoute,
  handleNotificationAction,
} from "./notification-actions"
import { logInfo } from "@/core/log/service"

const APP_START_TIME = Date.now()

let hasStartedNotificationRuntime = false
let handledNotificationResponseKey: string | null = null
let routeHandler: ((route: string) => void) | null = null
let routerReady = false
let pendingRoute: string | null = null

function buildNotificationResponseKey(response: Notifications.NotificationResponse) {
  return `${response.notification.request.identifier}:${response.actionIdentifier}`
}

function flushPendingRoute() {
  if (!pendingRoute || !routeHandler) {
    return
  }

  const route = pendingRoute
  pendingRoute = null
  routeHandler(route)
}

function dispatchRoute(route: string) {
  if (!routerReady || !routeHandler) {
    pendingRoute = route
    return
  }

  routeHandler(route)
}

export function markRouterReady() {
  routerReady = true
  flushPendingRoute()
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse | null,
  isLiveTap: boolean
) {
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

  // The cold-launch last-response replays the previous session's notification on
  // every reopen until the OS clears it. Only honor it when it is a fresh tap that
  // happened after this process started; otherwise it re-corrupts navigation on
  // each launch (blank screen, only fixed by force-stop).
  if (!isLiveTap && (response.notification.date ?? 0) < APP_START_TIME) {
    return
  }

  logInfo("Notification routed", { route })
  dispatchRoute(route)
}

export function setNotificationRouteHandler(handler: ((route: string) => void) | null) {
  routeHandler = handler
  if (routerReady) {
    flushPendingRoute()
  }
}

export function ensureNotificationRuntimeStarted() {
  if (hasStartedNotificationRuntime) {
    return
  }

  hasStartedNotificationRuntime = true
  void Notifications.getLastNotificationResponseAsync().then((response) =>
    handleNotificationResponse(response, false)
  )
  Notifications.addNotificationResponseReceivedListener((response) =>
    handleNotificationResponse(response, true)
  )
}
