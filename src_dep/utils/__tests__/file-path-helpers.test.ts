import { describe, expect, it } from "vitest"

import { getContainingFolderUri, getExtension, hashUri, toFileUri } from "@/utils/file-path-helpers"

describe("toFileUri", () => {
  it("prefixes non-file paths with file://", () => {
    expect(toFileUri("/data/x.mp3")).toBe("file:///data/x.mp3")
  })

  it("leaves existing file URIs untouched", () => {
    expect(toFileUri("file:///data/y.mp3")).toBe("file:///data/y.mp3")
  })
})

describe("hashUri", () => {
  it("is deterministic and stable for identical input", () => {
    expect(hashUri("content://x")).toBe(hashUri("content://x"))
  })

  it("differs for different input", () => {
    expect(hashUri("a")).not.toBe(hashUri("b"))
  })

  it("locks the empty-string hash to the DJB2 seed", () => {
    expect(hashUri("")).toBe("45h")
  })
})

describe("getExtension", () => {
  it("extracts lowercased extensions", () => {
    expect(getExtension("file:///a/b.mp3")).toBe(".mp3")
    expect(getExtension("file:///a/b.MP3")).toBe(".mp3")
  })

  it("ignores query and fragment", () => {
    expect(getExtension("content://x/track.flac?query=1#frag")).toBe(".flac")
  })

  it("returns the default extension when none is found", () => {
    expect(getExtension("file:///x/track")).toBe(".audio")
    expect(getExtension("http://x/path")).toBe(".audio")
  })

  it("decodes percent-encoded extensions", () => {
    expect(getExtension("file:///x/song%2Emp3")).toBe(".mp3")
  })

  it("only matches the final extension of a multi-dot filename", () => {
    expect(getExtension("file:///x/archive.tar.gz")).toBe(".gz")
  })
})

describe("getContainingFolderUri", () => {
  it("returns the parent folder of a file URI", () => {
    expect(getContainingFolderUri("file:///a/b/c.mp3")).toBe("file:///a/b")
  })

  it("returns null for non-file URIs", () => {
    expect(getContainingFolderUri("http://x/y")).toBeNull()
  })

  it("returns null when there is no folder above the root", () => {
    expect(getContainingFolderUri("file:///c.mp3")).toBeNull()
  })
})
