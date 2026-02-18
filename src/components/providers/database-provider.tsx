import { useEffect, useState } from "react"
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { ActivityIndicator, Text, View } from "react-native"

import { db } from "@/db/client"
import migrations from "@/db/migrations/migrations"
import { loadTracks } from "@/modules/player/player.store"

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)
  const { success, error } = useMigrations(db, migrations)

  useEffect(() => {
    if (!success) {
      return
    }

    const loadData = async () => {
      try {
        await loadTracks()
        setReady(true)
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

  if (!success || !ready) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="text-primary mb-4" />
        <Text className="text-foreground">Initializing database...</Text>
      </View>
    )
  }

  return <>{children}</>
}
