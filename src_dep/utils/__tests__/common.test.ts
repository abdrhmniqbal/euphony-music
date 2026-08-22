import { describe, expect, it } from "vitest"

import { formatDuration, formatFileSize, generateId } from "@/utils/common"

describe("formatDuration", () => {
  it("formats as h:mm:ss once an hour is reached", () => {
    expect(formatDuration(3661)).toBe("1:01:01")
    expect(formatDuration(3600)).toBe("1:00:00")
  })

  it("formats as m:ss under an hour", () => {
    expect(formatDuration(65)).toBe("1:05")
    expect(formatDuration(5)).toBe("0:05")
  })

  it("returns 0:00 for zero or invalid input", () => {
    expect(formatDuration(0)).toBe("0:00")
    expect(formatDuration(Number.NaN)).toBe("0:00")
  })
})

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B")
    expect(formatFileSize(1024)).toBe("1 KB")
    expect(formatFileSize(1536)).toBe("1.5 KB")
    expect(formatFileSize(1048576)).toBe("1 MB")
  })
})

describe("generateId", () => {
  it("returns a non-empty string", () => {
    expect(typeof generateId()).toBe("string")
    expect(generateId().length).toBeGreaterThan(0)
  })

  it("produces distinct ids", () => {
    expect(generateId()).not.toBe(generateId())
  })
})
