/**
 * Purpose: Runs reference-style app runtime after database migration and store hydration.
 * Caller: Root providers.
 * Dependencies: Drizzle migration hook, database runtime, and localization.
 * Main Functions: DatabaseProvider()
 * Side Effects: Starts DB runtime synchronization after migrations complete.
 */

import { AppRuntime } from "@/modules/runtime/app-runtime"

export function DatabaseProvider({
  children,
  onReady,
  onError,
}: {
  children: React.ReactNode
  onReady?: () => void
  onError?: () => void
}) {
  return (
    <AppRuntime onReady={onReady} onError={onError}>
      {children}
    </AppRuntime>
  )
}
