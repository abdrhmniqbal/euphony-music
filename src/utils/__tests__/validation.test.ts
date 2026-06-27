import { describe, expect, it } from "vitest"

import { isNumber, isString } from "@/utils/validation"

describe("isNumber", () => {
  it("returns true for numbers", () => {
    expect(isNumber(3)).toBe(true)
    expect(isNumber(0)).toBe(true)
    expect(isNumber(-2.5)).toBe(true)
  })

  it("returns false for non-numbers", () => {
    expect(isNumber("3")).toBe(false)
    expect(isNumber(null)).toBe(false)
    expect(isNumber(true)).toBe(false)
    expect(isNumber(undefined)).toBe(false)
  })
})

describe("isString", () => {
  it("returns true for strings", () => {
    expect(isString("a")).toBe(true)
    expect(isString("")).toBe(true)
  })

  it("returns false for non-strings", () => {
    expect(isString(1)).toBe(false)
    expect(isString(null)).toBe(false)
    expect(isString(true)).toBe(false)
  })
})
