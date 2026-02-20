import { useEffect, useState } from "react"
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { Skeleton } from "heroui-native"
import { Text, View } from "react-native"

import { db } from "@/db/client"
import migrations from "@/db/migrations/migrations"
import { loadTracks } from "@/modules/player/player.store"

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [hasLoadedTracks, setHasLoadedTracks] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const { success, error } = useMigrations(db, migrations)

  useEffect(() => {
    if (!success) {
      return
    }

    const loadData = async () => {
      try {
        await loadTracks()
        setHasLoadedTracks(true)
      } catch (dataError) {
        console.error("Database data loading failed", dataError)
        setLoadError(dataError as Error)
      }
    }

    void loadData()
  }, [success])

  const resolvedError = loadError ?? error

  if (resolvedError) {
    const message = resolvedError.message || ""
    const isLegacySchemaConflict =
      message.includes("CREATE TABLE") || message.includes("already exists")

    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Text className="mb-2 text-center text-danger">Database Error</Text>
        <Text className="text-muted-foreground text-center text-sm">
          {isLegacySchemaConflict
            ? "Schema conflict detected. Clear app data or reinstall once to re-baseline migrations."
            : message}
        </Text>
      </View>
    )
  }

  const isInitializing = !success || !hasLoadedTracks

  return (
    <View className="flex-1 bg-background">
      {children}
      {isInitializing ? (
        <View
          pointerEvents="none"
          className="absolute top-4 right-4 left-4 items-center"
        >
          <View className="w-full flex-row items-center justify-center gap-2 rounded-full border border-border/60 bg-background/95 px-4 py-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Text className="text-xs text-muted">Initializing database...</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}
