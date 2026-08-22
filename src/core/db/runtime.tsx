import { useMigrations } from "drizzle-orm/expo-sqlite/migrator"
import { type ReactNode } from "react"
import { View } from "react-native"

import { db } from "./client"
import migrations from "./migrations/migrations"

export function DatabaseGate({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(db, migrations)

  if (error) {
    if (__DEV__) {
      console.warn("Database migration failed", error)
    }
    return <View className="flex-1" />
  }

  if (!success) {
    return <View className="flex-1" />
  }

  return <>{children}</>
}
