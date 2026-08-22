import "../global.css"
import "../core/localization/i18n"

import { QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { useEffect } from "react"

import { DatabaseGate } from "@/core/db/runtime"
import { queryClient } from "@/core/query/query-client"
import { startPlaybackRuntime } from "@/playback/runtime"

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseGate>
        <Stack />
        <StartupEffects />
      </DatabaseGate>
    </QueryClientProvider>
  )
}

function StartupEffects() {
  useEffect(() => {
    void startPlaybackRuntime()
  }, [])
  return null
}
