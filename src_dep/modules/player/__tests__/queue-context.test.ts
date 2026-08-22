import { describe, expect, it } from "vitest"

import type { Track } from "@/modules/player/types"
import {
  allTracksShareValue,
  buildPlaybackQueue,
  inferQueueContext,
} from "@/modules/player/queue-context"

function track(overrides: Partial<Track> = {}): Track {
  return { id: "x", title: "t", duration: 0, uri: "", ...overrides }
}

describe("buildPlaybackQueue", () => {
  it("rotates the queue so the selected track starts first", () => {
    const tracks = [track({ id: "a" }), track({ id: "b" }), track({ id: "c" })]

    expect(buildPlaybackQueue(tracks, "b")).toEqual({
      queue: [track({ id: "b" }), track({ id: "c" }), track({ id: "a" })],
      queueTrackIds: ["b", "c", "a"],
    })
  })

  it("falls back to the first track when the id is missing", () => {
    const tracks = [track({ id: "a" }), track({ id: "b" })]

    expect(buildPlaybackQueue(tracks, "x").queueTrackIds).toEqual(["a", "b"])
  })

  it("returns an empty queue for empty input", () => {
    expect(buildPlaybackQueue([], "a")).toEqual({ queue: [], queueTrackIds: [] })
  })
})

describe("allTracksShareValue", () => {
  it("returns true when every track shares the value", () => {
    const tracks = [track({ albumId: "1" }), track({ albumId: "1" })]
    expect(allTracksShareValue(tracks, (item) => item.albumId)).toBe(true)
  })

  it("returns false when values differ", () => {
    const tracks = [track({ albumId: "1" }), track({ albumId: "2" })]
    expect(allTracksShareValue(tracks, (item) => item.albumId)).toBe(false)
  })

  it("compares case-insensitively", () => {
    const tracks = [track({ album: "A" }), track({ album: "a" })]
    expect(allTracksShareValue(tracks, (item) => item.album)).toBe(true)
  })

  it("returns false when any value is missing", () => {
    const tracks = [track({ album: "A" }), track({})]
    expect(allTracksShareValue(tracks, (item) => item.album)).toBe(false)
  })

  it("returns false for an empty list", () => {
    expect(allTracksShareValue([], () => "x")).toBe(false)
  })
})

describe("inferQueueContext", () => {
  it("returns the provided context with a trimmed title", () => {
    const result = inferQueueContext(track(), [track()], { type: "playlist", title: " My Mix " })
    expect(result).toEqual({ type: "playlist", title: "My Mix" })
  })

  it("returns an external context for external tracks", () => {
    expect(inferQueueContext(track({ isExternal: true, title: "Ext" }), [track()])).toEqual({
      type: "external",
      title: "Ext",
    })
  })

  it("infers an album context when all tracks share an album", () => {
    const tracks = [
      track({ album: "Album", albumId: "1" }),
      track({ album: "Album", albumId: "1" }),
    ]
    expect(inferQueueContext(tracks[0]!, tracks)).toEqual({ type: "album", title: "Album" })
  })

  it("infers an artist context when all tracks share an artist", () => {
    const tracks = [
      track({ artist: "Art", artistId: "1" }),
      track({ artist: "Art", artistId: "1" }),
    ]
    expect(inferQueueContext(tracks[0]!, tracks)).toEqual({ type: "artist", title: "Art" })
  })

  it("returns null when no context can be inferred", () => {
    expect(inferQueueContext(track(), [track()])).toBeNull()
  })
})
