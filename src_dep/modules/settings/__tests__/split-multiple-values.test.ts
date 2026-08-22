import { describe, expect, it } from "vitest"

import {
  extractArtistFromTitle,
  splitArtistsValue,
} from "@/modules/settings/split-engine"
import type { SplitMultipleValueConfig } from "@/modules/settings/types"

function baseConfig(overrides: Partial<SplitMultipleValueConfig> = {}): SplitMultipleValueConfig {
  return {
    artistSplitMode: "split",
    artistCharDelimiters: ["/", ";", ",", "+", "&"],
    artistWordDelimiters: ["featuring", "feat.", "feat", "ft.", "ft", "vs.", "versus", "with", "prod.", "prod"],
    extractArtistFromTitle: false,
    unsplitArtists: [],
    genreSplitSymbols: [";", "/", ","],
    ...overrides,
  }
}

describe("splitArtistsValue", () => {
  it("returns empty for blank input", () => {
    expect(splitArtistsValue("", baseConfig())).toEqual([])
    expect(splitArtistsValue(null, baseConfig())).toEqual([])
    expect(splitArtistsValue(undefined, baseConfig())).toEqual([])
  })

  it("splits on character delimiters without requiring surrounding spaces", () => {
    const config = baseConfig()
    expect(splitArtistsValue("Drake/PartyNextDoor", config)).toEqual(["Drake", "PartyNextDoor"])
    expect(splitArtistsValue("A & B", config)).toEqual(["A", "B"])
    expect(splitArtistsValue("A,B,C", config)).toEqual(["A", "B", "C"])
  })

  it("splits on word delimiters with spaces on both sides, case-insensitive", () => {
    const config = baseConfig()
    expect(splitArtistsValue("Drake feat. PartyNextDoor", config)).toEqual([
      "Drake",
      "PartyNextDoor",
    ])
    expect(splitArtistsValue("Drake Featuring Rihanna", config)).toEqual(["Drake", "Rihanna"])
    expect(splitArtistsValue("A vs. B", config)).toEqual(["A", "B"])
  })

  it("does not split on word delimiters without surrounding spaces", () => {
    const config = baseConfig()
    expect(splitArtistsValue("Drakefeat.PartyNextDoor", config)).toEqual([
      "Drakefeat.PartyNextDoor",
    ])
  })

  it("keeps an unsplit artist intact even when it contains delimiters", () => {
    const config = baseConfig({ unsplitArtists: ["A & B"] })
    expect(splitArtistsValue("A & B feat. C", config)).toEqual(["A & B", "C"])
  })

  it("dedupes case-insensitively across char and word splits", () => {
    const config = baseConfig()
    expect(splitArtistsValue("Drake / Drake feat. Drake", config)).toEqual(["Drake"])
  })

  it("returns the original when mode is original", () => {
    const config = baseConfig({ artistSplitMode: "original" })
    expect(splitArtistsValue("Drake feat. PartyNextDoor", config)).toEqual([
      "Drake feat. PartyNextDoor",
    ])
  })
})

describe("extractArtistFromTitle", () => {
  it("returns empty when disabled", () => {
    const config = baseConfig({ extractArtistFromTitle: false })
    expect(extractArtistFromTitle("Song (feat. X)", config)).toEqual([])
  })

  it("extracts co-artists from the title after a word delimiter", () => {
    const config = baseConfig({ extractArtistFromTitle: true })
    expect(extractArtistFromTitle("Song (feat. X)", config)).toEqual(["X"])
    expect(extractArtistFromTitle("Song feat. X & Y", config)).toEqual(["X", "Y"])
    expect(extractArtistFromTitle("Song featuring Rihanna", config)).toEqual(["Rihanna"])
    expect(extractArtistFromTitle("A vs. B", config)).toEqual(["B"])
  })

  it("strips wrapping parentheses from extracted names", () => {
    const config = baseConfig({ extractArtistFromTitle: true })
    expect(extractArtistFromTitle("Song (feat. X)", config)).toEqual(["X"])
  })

  it("does not corrupt the title when it contains char delimiters", () => {
    const config = baseConfig({ extractArtistFromTitle: true })
    expect(extractArtistFromTitle("Love, Love, Love (feat. X)", config)).toEqual(["X"])
  })

  it("returns empty when the title has no word delimiter", () => {
    const config = baseConfig({ extractArtistFromTitle: true })
    expect(extractArtistFromTitle("Just A Song", config)).toEqual([])
  })
})

describe("splitArtistsValue with title extraction", () => {
  it("merges co-artists from the title into the base artists", () => {
    const config = baseConfig({ extractArtistFromTitle: true })
    expect(splitArtistsValue("Drake", config, "Song (feat. PartyNextDoor)")).toEqual([
      "Drake",
      "PartyNextDoor",
    ])
  })

  it("ignores title extraction unless enabled", () => {
    const config = baseConfig({ extractArtistFromTitle: false })
    expect(splitArtistsValue("Drake", config, "Song (feat. X)")).toEqual(["Drake"])
  })
})
