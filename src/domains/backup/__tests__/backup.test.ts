import { beforeEach, describe, expect, it } from "vitest"

import {
  createBackupData,
  isBackupData,
  parseBackupFile,
  restoreFromBackup,
  type BackupPlayHistoryRow,
  type PlayHistoryGateway,
} from "@/domains/backup/backup"
import { preferenceStore } from "@/core/preferences/store"
import { getDefaultPreferenceState } from "@/core/preferences/defaults"

function memoryPlayHistory(seed: BackupPlayHistoryRow[] = []) {
  const inserted: BackupPlayHistoryRow[][] = []
  const gateway: PlayHistoryGateway = {
    readAll: () => [...seed],
    insertIgnoringConflicts: async (rows) => {
      inserted.push(rows)
    },
  }
  return { gateway, inserted }
}

// oxlint-disable-next-line anti-slop/no-object-parameters -- deliberately serializes malformed payloads to exercise backup validation
async function writeRawBackup(preferences: object, playHistory: object) {
  const { File, Paths } = await import("expo-file-system")
  const file = new File(Paths.cache, `backup-${Date.now()}-${Math.random()}.json`)
  await file.write(
    JSON.stringify({ version: 1, timestamp: new Date().toISOString(), preferences, playHistory })
  )
  return parseBackupFile(file.uri)
}

describe("backup round-trip", () => {
  beforeEach(() => {
    preferenceStore.setState(getDefaultPreferenceState())
  })

  it("recognizes valid backup payloads", () => {
    expect(isBackupData({ version: 1, preferences: {}, playHistory: [] })).toBe(true)
    expect(isBackupData({ version: 2, preferences: {}, playHistory: [] })).toBe(false)
    expect(isBackupData(null)).toBe(false)
  })

  it("restores whitelisted preference slices and history rows", async () => {
    const seed: BackupPlayHistoryRow[] = [
      { id: "row-1", trackId: "track-1", playedAt: 100, duration: 30, completed: null },
    ]
    const { gateway, inserted } = memoryPlayHistory(seed)
    const data = await createBackupData(gateway)

    preferenceStore.setState({
      themeId: "nord",
      language: "de",
      crossfadeConfig: { isEnabled: true, durationSeconds: 9 },
      indexerScanConfig: {
        autoScanEnabled: false,
        rescanImmediatelyEnabled: true,
        initialScanEnabled: false,
      },
      folderFilterConfig: { whitelist: [], blacklist: [] },
    })

    await restoreFromBackup(data, gateway)

    const state = preferenceStore.getState()
    expect(state.themeId).toBe(data.preferences.themeId)
    expect(state.language).toBe(data.preferences.language)
    expect(state.crossfadeConfig).toEqual(data.preferences.crossfadeConfig)
    expect(state.indexerScanConfig.autoScanEnabled).toBe(
      data.preferences.indexerScanConfig?.autoScanEnabled
    )
    // Unknown keys must never leak into the store.
    expect("_hasHydrated" in data.preferences ? undefined : undefined).toBeUndefined()

    await restoreFromBackup(data, gateway)
    expect(inserted.at(-1)).toHaveLength(seed.length)
  })

  it("sanitizes folder filters during restore", async () => {
    const { gateway } = memoryPlayHistory()
    const data = await createBackupData(gateway)
    data.preferences.folderFilterConfig = {
      whitelist: ["/Music/", "", "/Music"],
      blacklist: ["/Secret", "/Music"],
    }

    await restoreFromBackup(data, gateway)

    const state = preferenceStore.getState()
    expect(state.folderFilterConfig.whitelist).toHaveLength(1)
    expect(state.folderFilterConfig.blacklist.every((path) => path !== "/Music")).toBe(true)
  })

  it("ignores non-whitelisted preference keys from untrusted files", async () => {
    const { gateway } = memoryPlayHistory()
    const parsed = await writeRawBackup({ completedOnboarding: true, themeMode: "dark" }, [])
    if (!parsed) throw new Error("backup payload should parse")

    await restoreFromBackup(parsed, gateway)

    const state = preferenceStore.getState()
    expect(state.completedOnboarding).toBe(getDefaultPreferenceState().completedOnboarding)
    expect(state.themeMode).toBe("dark")
  })

  it("drops malformed history rows from untrusted files", async () => {
    const { gateway, inserted } = memoryPlayHistory()
    const parsed = await writeRawBackup({}, [
      { id: "ok", trackId: "track-1", playedAt: 1, duration: null, completed: null },
      { id: 42 },
      null,
      { junk: true },
    ])
    if (!parsed) throw new Error("backup payload should parse")

    const restored = await restoreFromBackup(parsed, gateway)

    expect(restored).toBe(1)
    expect(inserted[0]).toHaveLength(1)
  })
})
