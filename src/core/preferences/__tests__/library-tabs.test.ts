import { describe, expect, it } from "vitest"

import {
  getDefaultLibraryTabsConfig,
  getVisibleLibraryTabs,
  sanitizeLibraryTabsConfig,
} from "../library-tabs"

describe("library tabs config", () => {
  it("defaults to all tabs visible in canonical order", () => {
    const config = getDefaultLibraryTabsConfig()
    expect(getVisibleLibraryTabs(config)).toEqual([
      "Tracks",
      "Albums",
      "Artists",
      "Genres",
      "Playlists",
      "Folders",
      "Favorites",
    ])
  })

  it("drops unknown tabs and deduplicates while keeping stored order", () => {
    const config = sanitizeLibraryTabsConfig({
      tabs: [
        { id: "Favorites", visible: true },
        { id: "Bogus", visible: true },
        { id: "Tracks", visible: false },
        { id: "Favorites", visible: false },
      ],
    })
    expect(getVisibleLibraryTabs(config)).toEqual([
      "Favorites",
      "Albums",
      "Artists",
      "Genres",
      "Playlists",
      "Folders",
    ])
  })

  it("appends missing tabs as visible", () => {
    const config = sanitizeLibraryTabsConfig({ tabs: [{ id: "Albums", visible: false }] })
    expect(getVisibleLibraryTabs(config)).toEqual([
      "Tracks",
      "Artists",
      "Genres",
      "Playlists",
      "Folders",
      "Favorites",
    ])
  })

  it("returns defaults for malformed input", () => {
    expect(sanitizeLibraryTabsConfig(null)).toEqual(getDefaultLibraryTabsConfig())
    expect(sanitizeLibraryTabsConfig({ tabs: "nope" })).toEqual(getDefaultLibraryTabsConfig())
  })
})
