/**
 * Purpose: Composes app-level providers for localization, data fetching, database setup, and bootstrap listeners.
 * Caller: Root app layout.
 * Dependencies: React Query, localization provider, and reference-style app runtime provider.
 * Main Functions: RootProviders()
 * Side Effects: Starts bootstrap listeners runtime.
 */

import { QueryClientProvider } from "@tanstack/react-query"

import { queryClient } from "@/lib/tanstack-query"

import { DatabaseProvider } from "./database-provider"
import { LocalizationProvider } from "./localization-provider"

export function RootProviders({
  children,
  onDatabaseReady,
  onDatabaseError,
}: {
  children: React.ReactNode
  onDatabaseReady?: () => void
  onDatabaseError?: () => void
}) {
  return (
    <LocalizationProvider>
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider onReady={onDatabaseReady} onError={onDatabaseError}>
          {children}
        </DatabaseProvider>
      </QueryClientProvider>
    </LocalizationProvider>
  )
}
