import { describe, expect, it } from "vitest"

import {
  compareVersions,
  isPreviewReleaseVersion,
  isNewerVersion,
  normalizeVersion,
  parseChangelogReleaseNotes,
  parseVersion,
} from "@/modules/updates/version-compare"

describe("normalizeVersion", () => {
  it("strips leading non-digit characters and trims whitespace", () => {
    expect(normalizeVersion("v1.0.0")).toBe("1.0.0")
    expect(normalizeVersion("  1.2 ")).toBe("1.2")
    expect(normalizeVersion("1.0.0")).toBe("1.0.0")
  })
})

describe("parseVersion", () => {
  it("splits main and prerelease parts", () => {
    expect(parseVersion("1.2.3")).toEqual({ mainParts: [1, 2, 3], prereleaseParts: [] })
    expect(parseVersion("1.2.3-beta.1")).toEqual({
      mainParts: [1, 2, 3],
      prereleaseParts: ["beta", "1"],
    })
  })

  it("strips leading non-digits before parsing", () => {
    expect(parseVersion("v2.0")).toEqual({ mainParts: [2, 0], prereleaseParts: [] })
  })

  it("treats non-numeric main parts as zero", () => {
    expect(parseVersion("1.x.0")).toEqual({ mainParts: [1, 0, 0], prereleaseParts: [] })
  })
})

describe("compareVersions", () => {
  it("returns 0 for equal versions", () => {
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0)
  })

  it("compares numerically rather than lexically", () => {
    expect(compareVersions("1.0.10", "1.0.9")).toBeGreaterThan(0)
    expect(compareVersions("1.0.9", "1.0.10")).toBeLessThan(0)
  })

  it("pads missing parts with zero", () => {
    expect(compareVersions("1.0.0", "1.0")).toBe(0)
  })

  it("orders a release ahead of its prerelease", () => {
    expect(compareVersions("1.0.0-beta", "1.0.0")).toBeLessThan(0)
    expect(compareVersions("1.0.0", "1.0.0-beta")).toBeGreaterThan(0)
  })

  it("compares prerelease parts numerically when both are numbers", () => {
    expect(compareVersions("1.0.0-alpha.1", "1.0.0-alpha.2")).toBeLessThan(0)
  })

  it("compares prerelease parts lexically when both are strings", () => {
    expect(compareVersions("1.0.0-alpha", "1.0.0-beta")).toBeLessThan(0)
  })
})

describe("isNewerVersion", () => {
  it("returns true only when the candidate is strictly newer", () => {
    expect(isNewerVersion("2.0.0", "1.0.0")).toBe(true)
    expect(isNewerVersion("1.0.0", "1.0.0")).toBe(false)
    expect(isNewerVersion("1.0.0", "2.0.0")).toBe(false)
  })
})

describe("isPreviewReleaseVersion", () => {
  it("detects prerelease markers", () => {
    expect(isPreviewReleaseVersion("1.0.0-beta.1")).toBe(true)
    expect(isPreviewReleaseVersion("1.0.0-alpha")).toBe(true)
    expect(isPreviewReleaseVersion("2.0.0-rc.1")).toBe(true)
    expect(isPreviewReleaseVersion("1.0.0-preview")).toBe(true)
  })

  it("returns false for stable versions", () => {
    expect(isPreviewReleaseVersion("1.0.0")).toBe(false)
    expect(isPreviewReleaseVersion("1.0.0-stable")).toBe(false)
  })
})

describe("parseChangelogReleaseNotes", () => {
  const markdown = `## [2.0.0] - 2024-01-01

Release 2 body

## [1.5.0]

Release 1.5 body

## [1.0.0-beta.1]

Beta body
`

  it("returns only release notes up to the current version", () => {
    const notes = parseChangelogReleaseNotes(markdown, "1.5.0")

    expect(notes).toEqual([
      {
        version: "1.5.0",
        releaseName: "1.5.0",
        body: "Release 1.5 body",
        prerelease: false,
      },
      {
        version: "1.0.0-beta.1",
        releaseName: "1.0.0-beta.1",
        body: "Beta body",
        prerelease: true,
      },
    ])
  })

  it("returns every section when the current version is the latest", () => {
    expect(parseChangelogReleaseNotes(markdown, "2.0.0")).toHaveLength(3)
  })

  it("returns an empty array for empty input", () => {
    expect(parseChangelogReleaseNotes("", "1.0.0")).toEqual([])
  })
})
