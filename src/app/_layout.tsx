import "../global.css"
import "../core/localization/i18n"

import { QueryClientProvider } from "@tanstack/react-query"
import { Stack, useRouter } from "expo-router"
import { HeroUINativeProvider } from "heroui-native"
import { useEffect } from "react"

import { DatabaseGate } from "@/core/db/runtime"
import { queryClient } from "@/core/query/query-client"
import { AppToastRuntime } from "@/core/ui/app-toast-runtime"
import { getHiddenPlayerScreenOptions } from "@/core/navigation"
import { startPlaybackRuntime } from "@/playback/runtime"
import { startPostStartupWork } from "@/domains/indexer/bootstrap"
import { AppUpdateSheet } from "@/domains/updates/ui/app-update-sheet"
import { checkStartupAppUpdate } from "@/domains/updates/app-update-runtime"
import {
  ensureNotificationRuntimeStarted,
  markRouterReady,
  setNotificationRouteHandler,
} from "@/core/notifications/notification-runtime"

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <HeroUINativeProvider
        config={{
          devInfo: { stylingPrinciples: false },
          toast: {
            defaultProps: {
              placement: "bottom",
            },
          },
        }}
      >
        <DatabaseGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(main)" />
            <Stack.Screen
              name="player"
              // SAFETY: options come from our own boundary helper and are accepted by expo-router at runtime despite looser static types
              options={({ route }) => getHiddenPlayerScreenOptions(route) as never}
            />
          </Stack>
          <StartupEffects />
          <AppUpdateSheet />
          <AppToastRuntime />
        </DatabaseGate>
      </HeroUINativeProvider>
    </QueryClientProvider>
  )
}

function StartupEffects() {
  const router = useRouter()

  useEffect(() => {
    setNotificationRouteHandler((route) => {
      if (!router.canGoBack() && route !== "/(main)/(home)") {
        router.replace("/(main)/(home)")
      }
      // SAFETY: route strings originate from our own notification payloads and always name a registered screen
      router.push(route as never)
    })
    ensureNotificationRuntimeStarted()
    markRouterReady()

    void startPlaybackRuntime()
    startPostStartupWork()
    const timer = setTimeout(() => {
      void checkStartupAppUpdate()
    }, 8000)
    return () => clearTimeout(timer)
  }, [router])
  return null
}
