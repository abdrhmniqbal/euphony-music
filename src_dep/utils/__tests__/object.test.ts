import { describe, expect, it } from "vitest"

import { moveArray, shuffleArray } from "@/utils/object"

describe("moveArray", () => {
  it("moves an element to a later index", () => {
    expect(moveArray(["a", "b", "c", "d"], { fromIndex: 1, toIndex: 3 })).toEqual([
      "a",
      "c",
      "d",
      "b",
    ])
  })

  it("moves an element to an earlier index", () => {
    expect(moveArray(["a", "b", "c"], { fromIndex: 0, toIndex: 2 })).toEqual(["b", "c", "a"])
  })

  it("does not mutate the input array", () => {
    const input = ["a", "b", "c"]
    moveArray(input, { fromIndex: 0, toIndex: 2 })
    expect(input).toEqual(["a", "b", "c"])
  })
})

describe("shuffleArray", () => {
  it("returns a permutation of the input", () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result).toHaveLength(input.length)
    expect(result.sort()).toEqual(input)
  })

  it("does not mutate the input array", () => {
    const input = [1, 2, 3]
    shuffleArray(input)
    expect(input).toEqual([1, 2, 3])
  })
})
