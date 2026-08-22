import { describe, expect, it } from "vitest"

import { clampVolume, easeInOutCubic, getFadeDurationSeconds } from "../crossfade-math"

describe("clampVolume", () => {
  it("passes through values within [0, 1]", () => {
    expect(clampVolume(0.5)).toBe(0.5)
    expect(clampVolume(0)).toBe(0)
    expect(clampVolume(1)).toBe(1)
  })

  it("clamps below zero to silent", () => {
    expect(clampVolume(-1)).toBe(0)
  })

  it("clamps above one to full volume", () => {
    expect(clampVolume(2)).toBe(1)
  })

  it("falls back to full volume for non-finite input", () => {
    expect(clampVolume(Number.NaN)).toBe(1)
    expect(clampVolume(Number.POSITIVE_INFINITY)).toBe(1)
  })
})

describe("easeInOutCubic", () => {
  it("hits the endpoints", () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
  })

  it("is symmetric around the midpoint", () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5)
  })

  it("eases the first half cubically", () => {
    expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625)
  })
})

describe("getFadeDurationSeconds", () => {
  it("returns the requested duration for invalid track duration", () => {
    expect(getFadeDurationSeconds(0, 3)).toBe(3)
    expect(getFadeDurationSeconds(-5, 3)).toBe(3)
    expect(getFadeDurationSeconds(Number.NaN, 3)).toBe(3)
  })

  it("respects the requested duration when it fits within half the track", () => {
    expect(getFadeDurationSeconds(10, 4)).toBe(4)
    expect(getFadeDurationSeconds(10, 1)).toBe(1)
  })

  it("clamps short tracks to the minimum fade", () => {
    expect(getFadeDurationSeconds(1, 4)).toBe(0.75)
  })

  it("caps the fade at half the track duration", () => {
    expect(getFadeDurationSeconds(100, 60)).toBe(50)
  })
})
