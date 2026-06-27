import { describe, expect, it } from "vitest"

import { chunkArray } from "@/utils/array"

describe("chunkArray", () => {
  it("splits into evenly sized chunks", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it("returns an empty array for empty input", () => {
    expect(chunkArray([], 3)).toEqual([])
  })

  it("returns a single chunk when size exceeds length", () => {
    expect(chunkArray([1, 2], 4)).toEqual([[1, 2]])
  })

  it("preserves element order", () => {
    expect(chunkArray(["a", "b", "c", "d"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ])
  })
})
