import { describe, expect, it } from "vitest"

import { formatDuration, formatTrackCount } from "@/utils/format"

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(65)).toBe("1:05")
    expect(formatDuration(5)).toBe("0:05")
    expect(formatDuration(0)).toBe("0:00")
  })

  it("formats values that roll over a full hour", () => {
    expect(formatDuration(3600)).toBe("60:00")
    expect(formatDuration(3661)).toBe("61:01")
  })
})

describe("formatTrackCount", () => {
  it("uses the singular form for one track", () => {
    expect(formatTrackCount(1)).toBe("1 track")
  })

  it("uses the plural form otherwise", () => {
    expect(formatTrackCount(0)).toBe("0 tracks")
    expect(formatTrackCount(5)).toBe("5 tracks")
  })
})
