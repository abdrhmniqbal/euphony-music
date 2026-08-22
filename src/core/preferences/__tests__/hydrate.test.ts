import { describe, expect, it } from "vitest"

import { hydrateWithDefaults } from "../hydrate"

describe("hydrateWithDefaults", () => {
  it("returns defaults when stored value is missing or invalid", () => {
    const defaults = { a: 1, nested: { x: true, y: "s" } }
    expect(hydrateWithDefaults(defaults, undefined)).toEqual(defaults)
    expect(hydrateWithDefaults(defaults, null)).toEqual(defaults)
    expect(hydrateWithDefaults(defaults, "junk")).toEqual(defaults)
    expect(hydrateWithDefaults(defaults, [1, 2])).toEqual(defaults)
  })

  it("fills only missing keys from defaults", () => {
    const defaults = { a: 1, b: "keep", nested: { x: true, y: 2 } }
    expect(hydrateWithDefaults(defaults, { b: "stored", nested: { y: 9 } })).toEqual({
      a: 1,
      b: "stored",
      nested: { x: true, y: 9 },
    })
  })

  it("replaces arrays wholesale and drops unknown keys", () => {
    const defaults = { tags: ["a"], extra: false }
    const result = hydrateWithDefaults(defaults, { tags: ["b", "c"], unknown: 123 })
    expect(result).toEqual({ tags: ["b", "c"], extra: false })
  })

  it("keeps stored falsy values like false and zero", () => {
    const defaults = { flag: true, count: 5 }
    expect(hydrateWithDefaults(defaults, { flag: false, count: 0 })).toEqual({
      flag: false,
      count: 0,
    })
  })
})
