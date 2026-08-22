import { beforeEach, describe, expect, it, vi } from "vitest"

import { adjustOpacity, getRandomRainbowColor } from "@/utils/colors"

describe("adjustOpacity", () => {
  it("parses six-digit hex colors", () => {
    expect(adjustOpacity("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)")
  })

  it("expands three-digit hex colors", () => {
    expect(adjustOpacity("#fff", 1)).toBe("rgba(255, 255, 255, 1)")
  })

  it("replaces the alpha of rgba colors", () => {
    expect(adjustOpacity("rgba(10, 20, 30, 0.8)", 0.2)).toBe("rgba(10, 20, 30, 0.2)")
  })

  it("handles named colors", () => {
    expect(adjustOpacity("transparent", 0.5)).toBe("rgba(0, 0, 0, 0)")
    expect(adjustOpacity("white", 0.3)).toBe("rgba(255, 255, 255, 0.3)")
    expect(adjustOpacity("black", 0.3)).toBe("rgba(0, 0, 0, 0.3)")
  })

  it("falls back to black for unparseable colors", () => {
    expect(adjustOpacity("oklch(0.5 0.1 10)", 0.5)).toBe("rgba(0, 0, 0, 0.5)")
  })
})

describe("getRandomRainbowColor", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0)
  })

  it("returns the first available color", () => {
    expect(getRandomRainbowColor()).toBe("bg-rainbow-lime")
  })

  it("excludes the provided colors", () => {
    expect(getRandomRainbowColor(["bg-rainbow-lime"])).toBe("bg-rainbow-light-green")
    expect(getRandomRainbowColor(["bg-rainbow-lime", "bg-rainbow-light-green"])).toBe(
      "bg-rainbow-teal"
    )
  })
})
