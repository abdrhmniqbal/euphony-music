import "../global.css"
import "../core/localization/i18n"

import { QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"

import { DatabaseGate } from "@/core/db/runtime"
import { queryClient } from "@/core/query/query-client"

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <DatabaseGate>
        <Stack />
      </DatabaseGate>
    </QueryClientProvider>
  )
}
