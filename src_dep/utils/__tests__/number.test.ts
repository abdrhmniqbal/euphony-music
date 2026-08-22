import { describe, expect, it } from "vitest"

import { clamp } from "@/utils/number"

describe("clamp", () => {
  it("returns the value when within bounds", () => {
    expect(clamp(0, 5, 10)).toBe(5)
  })

  it("clamps to the minimum", () => {
    expect(clamp(0, -1, 10)).toBe(0)
  })

  it("clamps to the maximum", () => {
    expect(clamp(0, 20, 10)).toBe(10)
  })

  it("returns the bound when all equal", () => {
    expect(clamp(2, 2, 2)).toBe(2)
  })
})
