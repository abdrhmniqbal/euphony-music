/**
 * Purpose: Pure version parsing, comparison, and changelog release-note extraction.
 * Caller: App update service (checkForAppUpdate, changelog rendering) and app-version helpers.
 * Dependencies: none.
 * Main Functions: compareVersions(), isNewerVersion(), parseChangelogReleaseNotes(), isPreviewReleaseVersion()
 * Side Effects: None.
 */

export interface AppReleaseNote {
  version: string
  releaseName: string
  body: string
  prerelease: boolean
}

const PREVIEW_VERSION_PATTERN = /(?:^|[-.])(alpha|beta|rc|preview)(?:$|[-.\d])/i

export function isPreviewReleaseVersion(version: string) {
  return PREVIEW_VERSION_PATTERN.test(version)
}

export function normalizeVersion(value: string) {
  // Strip the local development-build marker (e.g. "1.2.3-dev") so a dev
  // client compares equal to its published release instead of appearing older.
  return value
    .trim()
    .replace(/^[^0-9]+/, "")
    .replace(/-dev(?:\.\d+)?$/i, "")
}

export function parseVersion(value: string) {
  const [main = "", prerelease = ""] = normalizeVersion(value).split("-", 2)
  const mainParts = main
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0))
  const prereleaseParts = prerelease.length > 0 ? prerelease.split(".") : []

  return {
    mainParts,
    prereleaseParts,
  }
}

function comparePrereleasePart(left: string, right: string) {
  const leftNumber = Number.parseInt(left, 10)
  const rightNumber = Number.parseInt(right, 10)
  const leftIsNumber = Number.isFinite(leftNumber) && `${leftNumber}` === left
  const rightIsNumber = Number.isFinite(rightNumber) && `${rightNumber}` === right

  if (leftIsNumber && rightIsNumber) {
    return leftNumber - rightNumber
  }

  if (leftIsNumber) {
    return -1
  }

  if (rightIsNumber) {
    return 1
  }

  return left.localeCompare(right)
}

export function compareVersions(left: string, right: string) {
  const leftVersion = parseVersion(left)
  const rightVersion = parseVersion(right)
  const maxLength = Math.max(leftVersion.mainParts.length, rightVersion.mainParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftVersion.mainParts[index] ?? 0
    const rightPart = rightVersion.mainParts[index] ?? 0
    if (leftPart !== rightPart) {
      return leftPart - rightPart
    }
  }

  if (leftVersion.prereleaseParts.length === 0 && rightVersion.prereleaseParts.length === 0) {
    return 0
  }

  if (leftVersion.prereleaseParts.length === 0) {
    return 1
  }

  if (rightVersion.prereleaseParts.length === 0) {
    return -1
  }

  const prereleaseMaxLength = Math.max(
    leftVersion.prereleaseParts.length,
    rightVersion.prereleaseParts.length
  )

  for (let index = 0; index < prereleaseMaxLength; index += 1) {
    const leftPart = leftVersion.prereleaseParts[index]
    const rightPart = rightVersion.prereleaseParts[index]
    if (leftPart === undefined) {
      return -1
    }
    if (rightPart === undefined) {
      return 1
    }

    const comparison = comparePrereleasePart(leftPart, rightPart)
    if (comparison !== 0) {
      return comparison
    }
  }

  return 0
}

export function isNewerVersion(candidate: string, current: string) {
  return compareVersions(candidate, current) > 0
}

export function parseChangelogReleaseNotes(markdown: string, currentVersion: string) {
  const headingPattern = /^##\s+\[([^\]]+)\](?:\s+-\s+([^\n]+))?\s*$/gm
  const matches: Array<{
    headingStart: number
    headingLength: number
    version: string
  }> = []

  let match: RegExpExecArray | null
  while ((match = headingPattern.exec(markdown)) !== null) {
    matches.push({
      headingStart: match.index,
      headingLength: match[0]?.length ?? 0,
      version: (match[1] ?? "").trim(),
    })
  }

  return matches
    .map((entry, index) => {
      const bodyStart = entry.headingStart + entry.headingLength
      const bodyEnd =
        index < matches.length - 1
          ? (matches[index + 1]?.headingStart ?? markdown.length)
          : markdown.length
      const body = markdown.slice(bodyStart, bodyEnd).trim()
      const version = entry.version

      if (version.length === 0 || compareVersions(version, currentVersion) > 0) {
        return null
      }

      return {
        version,
        releaseName: version,
        body,
        prerelease: normalizeVersion(version).includes("-"),
      } satisfies AppReleaseNote
    })
    .filter((release): release is AppReleaseNote => release !== null)
}
