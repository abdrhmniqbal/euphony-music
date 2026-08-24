/* oxlint-disable anti-slop/no-shape-in-symbol-names -- "shape" is this app's domain vocabulary for genre/mix visual patterns */
import { describe, expect, it } from "vitest"

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
} from "@/domains/mixes/mix-algo"
import type { MixCandidate } from "@/domains/mixes/mix-algo"

function candidate(overrides: Partial<MixCandidate> = {}): MixCandidate {
  return { id: "x", genres: [], ...overrides }
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
    const candidates = [
      candidate({ id: "1", artist: "A", genres: ["Rock", "Pop"] }),
      candidate({ id: "2", artist: "A", genres: ["Rock"] }),
      candidate({ id: "3", artist: "B", genres: ["Jazz"] }),
      candidate({ id: "4", artist: "C", genres: ["Pop"] }),
    ]

    expect(buildProfile(candidates)).toEqual({
      artistNames: ["A", "B", "C"],
      genreNames: ["Rock", "Pop", "Jazz"],
    })
  })

  it("ignores candidates without artist or genres", () => {
    expect(buildProfile([candidate({ id: "1" })])).toEqual({
      artistNames: [],
      genreNames: [],
    })
  })
})

describe("scoreTrack", () => {
  const profile = { artistNames: ["A"], genreNames: ["Rock"] }

  it("rewards matching artist, genres, and play count", () => {
    expect(
      scoreTrack(candidate({ artist: "A", genres: ["Rock", "Jazz"], playCount: 5 }), profile)
    ).toBe(6.75)
  })

  it("returns zero when nothing matches", () => {
    expect(scoreTrack(candidate({ artist: "B", genres: ["Pop"], playCount: 0 }), profile)).toBe(0)
  })

  it("caps play-count contribution at 10", () => {
    expect(scoreTrack(candidate({ artist: "A", genres: [], playCount: 20 }), profile)).toBe(5.5)
  })
})
