import "../global.css"
import "../core/localization/i18n"

import { QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
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
  useEffect(() => {
    void startPlaybackRuntime()
    startPostStartupWork()
    const timer = setTimeout(() => {
      void checkStartupAppUpdate()
    }, 8000)
    return () => clearTimeout(timer)
  }, [])
  return null
}
