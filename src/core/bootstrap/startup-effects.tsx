import { useEffect } from "react"
import { useRouter } from "expo-router"

import { checkStartupAppUpdate } from "@/domains/updates/app-update-runtime"
import { startPostStartupWork } from "@/domains/indexer/bootstrap"
import {
  ensureNotificationRuntimeStarted,
  markRouterReady,
  setNotificationRouteHandler,
} from "@/core/notifications/notification-runtime"
import { startPlaybackRuntime } from "@/playback/runtime"
import { usePlayerWidgetSync } from "@/widgets/use-player-widget-sync"

const APP_UPDATE_CHECK_DELAY_MS = 8000

export function StartupEffects() {
  const router = useRouter()

  usePlayerWidgetSync()

  useEffect(() => {
    setNotificationRouteHandler((route) => {
      if (!router.canGoBack() && route !== "/(main)/(home)") {
        router.replace("/(main)/(home)")
      }
      // SAFETY: route strings come from our own notification payloads and always name a registered screen
      router.push(route as never)
    })
    ensureNotificationRuntimeStarted()
    markRouterReady()

    void startPlaybackRuntime()
    startPostStartupWork()

    const timer = setTimeout(() => {
      void checkStartupAppUpdate()
    }, APP_UPDATE_CHECK_DELAY_MS)

    return () => clearTimeout(timer)
  }, [router])

  return null
}
