import { describe, expect, it } from "vitest"

import { mergeText } from "@/utils/merge-text"

describe("mergeText", () => {
  it("joins values with the default separator", () => {
    expect(mergeText(["a", "b"])).toBe("a • b")
  })

  it("uses a custom separator", () => {
    expect(mergeText(["a", "b"], "-")).toBe("a-b")
  })

  it("drops null, false, and empty values", () => {
    expect(mergeText(["a", null, "b", false, ""])).toBe("a • b")
  })

  it("trims each value before joining", () => {
    expect(mergeText(["  x  ", "  y  "])).toBe("x • y")
  })

  it("returns an empty string when nothing remains", () => {
    expect(mergeText([null, false, "  "])).toBe("")
  })
})
