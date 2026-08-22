import { describe, expect, it } from "vitest"

import { isAlreadyInitializedError } from "@/modules/player/setup-error"

describe("isAlreadyInitializedError", () => {
  it("detects the native 'already initialized' error", () => {
    expect(
      isAlreadyInitializedError(new Error("The player is already been initialized"))
    ).toBe(true)
  })

  it("ignores unrelated errors", () => {
    expect(isAlreadyInitializedError(new Error("network timeout"))).toBe(false)
  })

  it("returns false for non-Error values", () => {
    expect(isAlreadyInitializedError("already been initialized")).toBe(false)
    expect(isAlreadyInitializedError(null)).toBe(false)
    expect(isAlreadyInitializedError(undefined)).toBe(false)
  })
})
