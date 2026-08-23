import { describe, expect, it } from "vitest"
import {
  findSyncedLineIndex,
  findTimedLineIndex,
  getTimedLineText,
  hasWordLevelTiming,
  parseLyrics,
} from "@/domains/lyrics/parser"

describe("parseLyrics", () => {
  it("returns empty for blank input", () => {
    expect(parseLyrics("").kind).toBe("empty")
    expect(parseLyrics(null).kind).toBe("empty")
    expect(parseLyrics("   \n  ").kind).toBe("empty")
  })

  it("parses plain text as static", () => {
    const doc = parseLyrics("line one\n\nline two")
    expect(doc.kind).toBe("static")
    if (doc.kind === "static") {
      expect(doc.lines.map((l) => l.text)).toEqual(["line one", "", "line two"])
      expect(doc.lines[1]?.isSpacer).toBe(true)
      expect(doc.lines[0]?.isSpacer).toBe(false)
    }
  })

  it("strips LRC header and comment lines from static", () => {
    const doc = parseLyrics("[ti:Title]\n[ar:Artist]\n# comment\nhello world")
    expect(doc.kind).toBe("static")
    if (doc.kind === "static") {
      expect(doc.lines.map((l) => l.text)).toEqual(["hello world"])
    }
  })

  it("parses a timestamped line as synced, not static", () => {
    const doc = parseLyrics("[00:12.34] just words")
    expect(doc.kind).toBe("synced")
    if (doc.kind === "synced") {
      expect(doc.lines[0]).toMatchObject({ time: 12.34, text: "just words" })
    }
  })

  it("parses LRC timestamps as synced", () => {
    const doc = parseLyrics("[00:12.00] first\n[00:15.50] second")
    expect(doc.kind).toBe("synced")
    if (doc.kind === "synced") {
      expect(doc.lines).toHaveLength(2)
      expect(doc.lines[0]).toMatchObject({ time: 12, text: "first" })
      expect(doc.lines[1]).toMatchObject({ time: 15.5, text: "second" })
    }
  })

  it("parses JSON synced lyrics", () => {
    const doc = parseLyrics(JSON.stringify([{ text: "a", time: 1 }, { text: "b", time: 2 }]))
    expect(doc.kind).toBe("synced")
    if (doc.kind === "synced") {
      expect(doc.lines.map((l) => l.text)).toEqual(["a", "b"])
    }
  })

  it("prefers synced over static when timestamps exist", () => {
    const doc = parseLyrics("[00:01.00] verse one\n[00:04.00] verse two")
    expect(doc.kind).toBe("synced")
  })

  it("parses angle-tagged timed lyrics", () => {
    const doc = parseLyrics("Hello <00:11.55>world <00:11.96>again")
    expect(doc.kind).toBe("timed")
    if (doc.kind === "timed") {
      expect(doc.lines).toHaveLength(1)
      // Words are the text between consecutive angle tags; leading/trailing text is ignored.
      expect(doc.lines[0]?.words.map((w) => w.text)).toEqual(["world"])
      expect(doc.lines[0]?.begin).toBeCloseTo(11.55)
      expect(doc.lines[0]?.words[0]?.end).toBeCloseTo(11.96)
    }
  })

  it("parses TTML-style p/span timed lyrics", () => {
    const raw = '<p begin="0:01.00"><span begin="0:01.00">hello </span><span begin="0:02.00">world</span></p>'
    const doc = parseLyrics(raw)
    expect(doc.kind).toBe("timed")
    if (doc.kind === "timed") {
      expect(getTimedLineText(doc.lines[0])).toBe("hello world")
      expect(hasWordLevelTiming(doc.lines[0])).toBe(true)
    }
  })

  it("treats timed markup without timing as static", () => {
    const doc = parseLyrics("<p>hello world</p>")
    expect(doc.kind).toBe("static")
  })

  it("parses <text>-wrapped TTML as timed", () => {
    const raw =
      '<?xml version="1.0"?><tt><body><div><text begin="0:01.00">hello </text><text begin="0:02.00">world</text></div></body></tt>'
    const doc = parseLyrics(raw)
    expect(doc.kind).toBe("timed")
    if (doc.kind === "timed") {
      expect(getTimedLineText(doc.lines[0])).toBe("hello")
      expect(getTimedLineText(doc.lines[1])).toBe("world")
    }
  })

  it("parses <text> without line begin but timed spans", () => {
    const raw =
      '<?xml version="1.0"?><tt><body><div><text>hi <span begin="0:01.00">there</span> <span begin="0:02.00">now</span></text></div></body></tt>'
    const doc = parseLyrics(raw)
    expect(doc.kind).toBe("timed")
  })
})

describe("active line index", () => {
  const synced = [
    { id: "1", time: 0, text: "a" },
    { id: "2", time: 10, text: "b" },
    { id: "3", time: 20, text: "c" },
  ]

  it("finds the latest line at or before time", () => {
    expect(findSyncedLineIndex(synced, 15)).toBe(1)
    expect(findSyncedLineIndex(synced, 10)).toBe(1)
    expect(findSyncedLineIndex(synced, 0)).toBe(0)
  })

  it("returns -1 before the first line", () => {
    expect(findSyncedLineIndex(synced, -5)).toBe(-1)
  })

  it("finds timed line by begin time", () => {
    const timed = [
      { id: "1", begin: 0, end: 5, words: [] },
      { id: "2", begin: 10, end: 15, words: [] },
    ]
    expect(findTimedLineIndex(timed, 12)).toBe(1)
    expect(findTimedLineIndex(timed, 3)).toBe(0)
    expect(findTimedLineIndex(timed, -1)).toBe(-1)
  })
})
