import { describe, expect, it } from "vitest"

import type { Track } from "@/modules/player/types"
import {
  buildProfile,
  getDaySeed,
  getMixVisual,
  getStartOfNextLocalDay,
  getStartOfNextLocalWeek,
  getWeekSeed,
  scoreTrack,
  shuffle,
  toMixShape,
} from "@/modules/mixes/mix-algo"

function track(overrides: Partial<Track> = {}): Track {
  return { id: "x", title: "t", duration: 0, uri: "", ...overrides }
}

describe("shuffle", () => {
  it("is deterministic for a fixed seed", () => {
    const a = shuffle([1, 2, 3, 4, 5], 7)
    const b = shuffle([1, 2, 3, 4, 5], 7)
    expect(a).toEqual(b)
  })

  it("returns a permutation of the input", () => {
    const result = shuffle([1, 2, 3, 4], 42)
    expect(result).toHaveLength(4)
    expect(result.sort()).toEqual([1, 2, 3, 4])
  })

  it("handles empty and single-element arrays", () => {
    expect(shuffle([], 1)).toEqual([])
    expect(shuffle([1], 1)).toEqual([1])
  })

  it("does not mutate the input array", () => {
    const input = [1, 2, 3]
    shuffle(input, 9)
    expect(input).toEqual([1, 2, 3])
  })
})

describe("getDaySeed", () => {
  it("encodes year, month, and day into a stable integer", () => {
    expect(getDaySeed(new Date(2024, 5, 15))).toBe(20240615)
    expect(getDaySeed(new Date(2020, 0, 1))).toBe(20200101)
  })
})

describe("getWeekSeed", () => {
  it("encodes year and week number", () => {
    expect(getWeekSeed(new Date(2024, 0, 10))).toBe(202401)
  })
})

describe("getStartOfNextLocalDay", () => {
  it("returns midnight of the following local day", () => {
    const expected = new Date(2024, 5, 16).getTime()
    expect(getStartOfNextLocalDay(new Date(2024, 5, 15, 10, 30))).toBe(expected)
  })
})

describe("getStartOfNextLocalWeek", () => {
  it("returns the next Monday midnight from a Saturday", () => {
    const expected = new Date(2024, 5, 17).getTime()
    expect(getStartOfNextLocalWeek(new Date(2024, 5, 15))).toBe(expected)
  })

  it("returns the next Monday midnight from a Sunday", () => {
    const expected = new Date(2024, 5, 17).getTime()
    expect(getStartOfNextLocalWeek(new Date(2024, 5, 16))).toBe(expected)
  })
})

describe("getMixVisual", () => {
  it("returns the base visual when nothing is reserved", () => {
    expect(getMixVisual(0)).toEqual({ colorIndex: 0, shape: "circles" })
    expect(getMixVisual(3)).toEqual({ colorIndex: 3, shape: "diamonds" })
  })

  it("avoids a reserved color/shape pair", () => {
    expect(getMixVisual(0, { colorIndex: 0, shape: "circles" })).toEqual({
      colorIndex: 1,
      shape: "waves",
    })
  })
})

describe("toMixShape", () => {
  it("returns valid shapes unchanged", () => {
    expect(toMixShape("waves")).toBe("waves")
    expect(toMixShape("circles")).toBe("circles")
  })

  it("falls back to circles for unknown shapes", () => {
    expect(toMixShape("nope")).toBe("circles")
  })
})

describe("buildProfile", () => {
  it("ranks artists and genres by frequency", () => {
    const tracks = [
      track({ id: "1", artist: "A", genre: "Rock, Pop" }),
      track({ id: "2", artist: "A", genre: "Rock" }),
      track({ id: "3", artist: "B", genre: "Jazz" }),
      track({ id: "4", artist: "C", genre: "Pop" }),
    ]

    expect(buildProfile(tracks)).toEqual({
      artistNames: ["A", "B", "C"],
      genreNames: ["Rock", "Pop", "Jazz"],
    })
  })

  it("ignores tracks without artist or genre", () => {
    expect(buildProfile([track({ id: "1" })])).toEqual({
      artistNames: [],
      genreNames: [],
    })
  })
})

describe("scoreTrack", () => {
  const profile = { artistNames: ["A"], genreNames: ["Rock"] }

  it("rewards matching artist, genres, and play count", () => {
    expect(scoreTrack(track({ artist: "A", genre: "Rock, Jazz", playCount: 5 }), profile)).toBe(
      6.75
    )
  })

  it("returns zero when nothing matches", () => {
    expect(scoreTrack(track({ artist: "B", genre: "Pop", playCount: 0 }), profile)).toBe(0)
  })

  it("caps play-count contribution at 10", () => {
    expect(scoreTrack(track({ artist: "A", playCount: 20 }), profile)).toBe(5.5)
  })
})
