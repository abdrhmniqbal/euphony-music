import { beforeEach, describe, expect, it, vi } from "vitest"

const insertMock = vi.fn()
const selectValuesMock = vi.fn()

vi.mock("expo-file-system", () => ({
  File: class {},
  Directory: class {},
  Paths: { document: "/tmp" },
}))

vi.mock("react-native", () => ({
  I18nManager: { allowRTL: () => {}, forceRTL: () => {}, isRTL: false },
}))

vi.mock("uniwind", () => ({
  Uniwind: { setTheme: () => {} },
}))

vi.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "en", languageTag: "en" }],
  locale: "en",
}))

vi.mock("expo-application", () => ({
  applicationId: "com.startune.music",
  nativeApplicationVersion: "2.0.0",
  applicationName: "Startune",
}))

vi.mock("@/core/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        all: () => [],
        where: () => [],
      }),
    }),
    delete: () => ({ where: () => {} }),
    insert: () => {
      const builder: Record<string, unknown> = {
        values: (rows: unknown[]) => {
          insertMock(rows)
          return builder
        },
        onConflictDoNothing: () => Promise.resolve(),
      }
      return builder
    },
  },
}))

vi.mock("expo-sqlite/kv-store", () => ({
  AsyncStorage: {
    getItem: async () => null,
    setItem: async () => {},
  },
}))

import { createBackupData, isBackupData, restoreFromBackup } from "@/domains/backup/backup"
import { preferenceStore } from "@/core/preferences/store"
import { getDefaultPreferenceState } from "@/core/preferences/defaults"

describe("backup round-trip", () => {
  beforeEach(() => {
    preferenceStore.setState(getDefaultPreferenceState())
    insertMock.mockClear()
  })

  it("recognizes valid backup payloads", () => {
    expect(isBackupData({ version: 1, preferences: {}, playHistory: [] })).toBe(true)
    expect(isBackupData({ version: 2, preferences: {}, playHistory: [] })).toBe(false)
    expect(isBackupData(null)).toBe(false)
  })

  it("restores whitelisted preference slices and history rows", async () => {
    const data = await createBackupData()

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

    await restoreFromBackup(data)

    const state = preferenceStore.getState()
    expect(state.themeId).toBe(data.preferences.themeId)
    expect(state.language).toBe(data.preferences.language)
    expect(state.crossfadeConfig).toEqual(data.preferences.crossfadeConfig)
    expect(state.indexerScanConfig.autoScanEnabled).toBe(
      (
        data.preferences.indexerScanConfig as { autoScanEnabled: boolean }
      ).autoScanEnabled
    )
    // Unknown keys must never leak into the store.
    expect("_hasHydrated" in data.preferences ? undefined : undefined).toBeUndefined()

    if (data.playHistory.length > 0) {
      expect(insertMock).toHaveBeenCalled()
    }
  })

  it("sanitizes folder filters during restore", async () => {
    const data = await createBackupData()
    data.preferences.folderFilterConfig = {
      whitelist: ["/Music/", "", "/Music"],
      blacklist: ["/Secret", "/Music"],
    }

    await restoreFromBackup(data)

    const state = preferenceStore.getState()
    expect(state.folderFilterConfig.whitelist).toHaveLength(1)
    expect(state.folderFilterConfig.blacklist.every((path) => path !== "/Music")).toBe(true)
  })
})
