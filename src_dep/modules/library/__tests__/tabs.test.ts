import { describe, expect, it } from "vitest"

import {
  ensureAtLeastOneVisibleTab,
  getDefaultLibraryTabsConfig,
  getVisibleLibraryTabs,
  LIBRARY_TABS,
  sanitizeLibraryTabsConfig,
} from "@/modules/library/tabs"

describe("sanitizeLibraryTabsConfig", () => {
  it("returns all tabs visible for the default config", () => {
    const config = getDefaultLibraryTabsConfig()
    expect(config.tabs).toHaveLength(7)
    expect(config.tabs.every((t) => t.visible)).toBe(true)
    expect(new Set(config.tabs.map((t) => t.id)).size).toBe(7)
  })

  it("ignores unknown tab ids", () => {
    const config = sanitizeLibraryTabsConfig({
      tabs: [
        { id: "Tracks", visible: true },
        { id: "NotATab", visible: true },
      ],
    })
    expect(config.tabs.find((t) => t.id === "NotATab")).toBeUndefined()
    expect(config.tabs.some((t) => t.id === "Tracks")).toBe(true)
  })

  it("collapses duplicate ids (first entry wins)", () => {
    const config = sanitizeLibraryTabsConfig({
      tabs: [
        { id: "Tracks", visible: false },
        { id: "Tracks", visible: true },
      ],
    })
    const tracks = config.tabs.filter((t) => t.id === "Tracks")
    expect(tracks).toHaveLength(1)
    expect(tracks[0].visible).toBe(false)
  })

  it("appends missing tabs as visible", () => {
    const config = sanitizeLibraryTabsConfig({ tabs: [{ id: "Tracks", visible: false }] })
    expect(config.tabs).toHaveLength(7)
    const albums = config.tabs.find((t) => t.id === "Albums")
    expect(albums?.visible).toBe(true)
  })

  it("defaults visible to true unless explicitly false", () => {
    const config = sanitizeLibraryTabsConfig({
      tabs: [
        { id: "Tracks" },
        { id: "Albums", visible: true },
        { id: "Artists", visible: false },
      ],
    })
    expect(config.tabs.find((t) => t.id === "Tracks")?.visible).toBe(true)
    expect(config.tabs.find((t) => t.id === "Albums")?.visible).toBe(true)
    expect(config.tabs.find((t) => t.id === "Artists")?.visible).toBe(false)
  })

  it("treats non-object and non-array input as empty", () => {
    expect(sanitizeLibraryTabsConfig(null).tabs).toHaveLength(7)
    expect(sanitizeLibraryTabsConfig("nope").tabs).toHaveLength(7)
    expect(
      sanitizeLibraryTabsConfig({ tabs: [{ id: "Tracks", visible: true }, "junk"] }).tabs
    ).toHaveLength(7)
  })
})

describe("getVisibleLibraryTabs", () => {
  it("excludes tabs marked visible:false but includes missing tabs as visible", () => {
    const config = sanitizeLibraryTabsConfig({
      tabs: [
        { id: "Tracks", visible: true },
        { id: "Albums", visible: false },
        { id: "Artists", visible: true },
      ],
    })
    expect(getVisibleLibraryTabs(config)).toEqual([
      "Tracks",
      "Artists",
      "Genres",
      "Playlists",
      "Folders",
      "Favorites",
    ])
  })

  it("returns an empty list when every tab is explicitly hidden", () => {
    // The previous fallback-to-first-tab branch was removed: with no dead
    // fallback, an all-hidden config honestly yields []. Callers that require
    // a non-empty selection must enforce it themselves.
    const config = sanitizeLibraryTabsConfig({
      tabs: LIBRARY_TABS.map((id) => ({ id, visible: false })),
    })
    expect(getVisibleLibraryTabs(config)).toEqual([])
  })

  it("re-sanitizes its input, so unlisted tabs are always present and visible", () => {
    // getVisibleLibraryTabs re-runs sanitize, which appends every built-in tab
    // as visible when absent. The fallback-to-first-tab branch is therefore
    // unreachable in practice; this locks the actual (append-missing) behavior.
    const config = sanitizeLibraryTabsConfig({
      tabs: [
        { id: "Tracks", visible: false },
        { id: "Albums", visible: false },
      ],
    })
    expect(getVisibleLibraryTabs(config)).toEqual([
      "Artists",
      "Genres",
      "Playlists",
      "Folders",
      "Favorites",
    ])
  })
})

describe("ensureAtLeastOneVisibleTab", () => {
  it("leaves a config with at least one visible tab unchanged", () => {
    const config = sanitizeLibraryTabsConfig({
      tabs: [
        { id: "Tracks", visible: false },
        { id: "Albums", visible: true },
      ],
    })
    expect(ensureAtLeastOneVisibleTab(config)).toBe(config)
  })

  it("forces the first tab visible when all are hidden", () => {
    const config = sanitizeLibraryTabsConfig({
      tabs: LIBRARY_TABS.map((id) => ({ id, visible: false })),
    })
    const fixed = ensureAtLeastOneVisibleTab(config)
    expect(fixed.tabs[0].visible).toBe(true)
    expect(fixed.tabs.slice(1).every((t) => !t.visible)).toBe(true)
    expect(getVisibleLibraryTabs(fixed)).toEqual([fixed.tabs[0].id])
  })

  it("defaults to built-in tabs when given an empty config", () => {
    const fixed = ensureAtLeastOneVisibleTab({ tabs: [] })
    expect(fixed.tabs).toHaveLength(7)
    expect(fixed.tabs[0].visible).toBe(true)
  })
})
