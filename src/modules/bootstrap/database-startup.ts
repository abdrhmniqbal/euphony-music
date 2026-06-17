import { logError, logInfo } from "@/modules/logging/service"
import { loadTracks } from "@/modules/player/library"

export async function loadInitialDatabaseState() {
  try {
    logInfo("Database startup loading cached tracks")
    await loadTracks()
    logInfo("Database startup cached tracks loaded")
  } catch (error) {
    logError("Database startup failed to load cached tracks", error)
    throw error
  }
}
