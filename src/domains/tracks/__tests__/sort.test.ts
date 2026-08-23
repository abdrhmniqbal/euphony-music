import { describe, expect, it } from "vitest"

import type { DataTrack } from "../types"
import { sortTracks } from "../sort"

function track(overrides: Partial<DataTrack>): DataTrack {
  return {
    id: "t",
    name: "Track",
    artwork: null,
    artists: null,
    artistName: null,
    albumName: null,
    uri: "file:///t.mp3",
    duration: 100,
    discoverTime: null,
    modificationTime: null,
    ...overrides,
  }
}

describe("sortTracks", () => {
  const tracks = [
    track({ id: "1", name: "b", artistName: "Zed", albumName: "Beta", duration: 30 }),
    track({ id: "2", name: "a", artistName: "alpha", albumName: "alpha", duration: 20 }),
    track({ id: "3", name: "c", artistName: null, albumName: null, duration: 10 }),
  ]

  it("sorts by name ascending case-insensitively", () => {
    expect(sortTracks(tracks, "name", true).map((t) => t.id)).toEqual(["2", "1", "3"])
  })

  it("sorts by name descending", () => {
    expect(sortTracks(tracks, "name", false).map((t) => t.id)).toEqual(["3", "1", "2"])
  })

  it("treats missing artists as empty strings", () => {
    expect(sortTracks(tracks, "artistName", true).map((t) => t.id)).toEqual(["3", "2", "1"])
  })

  it("sorts numerically by duration", () => {
    expect(sortTracks(tracks, "duration", true).map((t) => t.id)).toEqual(["3", "2", "1"])
  })

  it("does not mutate the input array", () => {
    const input = [...tracks]
    sortTracks(tracks, "name", false)
    expect(tracks).toEqual(input)
  })
})
