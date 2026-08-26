import type { PlayerTrack } from "@/playback/types"

export interface FolderEntry {
  id: string
  name: string
  path: string
  fileCount: number
}

export interface FolderBreadcrumb {
  name: string
  path: string
}

export interface FolderBrowserState {
  folders: FolderEntry[]
  tracks: PlayerTrack[]
  breadcrumbs: FolderBreadcrumb[]
}

interface FolderNode {
  name: string
  path: string
  children: Map<string, FolderNode>
  tracks: PlayerTrack[]
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function getTrackDirectorySegments(track: PlayerTrack): string[] {
  const uri = track.uri || ""
  if (!uri) {
    return []
  }

  const withoutScheme = uri.replace(/^file:\/\//, "")
  const normalized = withoutScheme.replace(/\\/g, "/")
  const clean = normalized.split("?")[0].split("#")[0]
  const lastSlashIndex = clean.lastIndexOf("/")

  if (lastSlashIndex <= 0) {
    return []
  }

  const directory = clean.slice(0, lastSlashIndex)
  return directory.split("/").filter(Boolean)
}

// Device root prefixes like storage/emulated/0 carry no browse meaning; hide them
function trimDeviceRootSegments(segments: string[]): string[] {
  if (segments.length >= 3) {
    const [first, second, third] = segments
    if (first.toLowerCase() === "storage" && second.toLowerCase() === "emulated" && third === "0") {
      return segments.slice(3)
    }
  }

  if (segments.length >= 2 && segments[0]?.toLowerCase() === "storage") {
    return segments.slice(2)
  }

  return segments
}

function buildFolderTree(tracks: PlayerTrack[]): FolderNode {
  const root: FolderNode = {
    name: "root",
    path: "",
    children: new Map(),
    tracks: [],
  }

  for (const track of tracks) {
    const fullSegments = getTrackDirectorySegments(track)
    const segments = trimDeviceRootSegments(fullSegments)
    let current = root

    for (const segment of segments) {
      const existing = current.children.get(segment)
      if (existing) {
        current = existing
        continue
      }

      const nextPath = current.path ? `${current.path}/${segment}` : segment
      const nextNode: FolderNode = {
        name: decodePathSegment(segment),
        path: nextPath,
        children: new Map(),
        tracks: [],
      }
      current.children.set(segment, nextNode)
      current = nextNode
    }

    current.tracks.push(track)
  }

  return root
}

function getNodeByPath(root: FolderNode, path: string): FolderNode {
  if (!path) {
    return root
  }

  let current = root
  for (const segment of path.split("/").filter(Boolean)) {
    const next = current.children.get(segment)
    if (!next) {
      return root
    }
    current = next
  }

  return current
}

function countItemsRecursively(node: FolderNode): number {
  let count = node.tracks.length

  for (const child of node.children.values()) {
    count += 1 + countItemsRecursively(child)
  }

  return count
}

function buildBreadcrumbs(path: string): FolderBreadcrumb[] {
  if (!path) {
    return []
  }

  const breadcrumbs: FolderBreadcrumb[] = []
  let currentPath = ""

  for (const segment of path.split("/").filter(Boolean)) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment
    breadcrumbs.push({
      name: decodePathSegment(segment),
      path: currentPath,
    })
  }

  return breadcrumbs
}

export function getParentFolderPath(path: string): string {
  const segments = path.split("/").filter(Boolean)
  segments.pop()
  return segments.join("/")
}

export function buildFolderBrowserState(
  tracks: PlayerTrack[],
  currentPath: string
): FolderBrowserState {
  const root = buildFolderTree(tracks)
  const currentNode = getNodeByPath(root, currentPath)

  const folders = Array.from(currentNode.children.values())
    .map((node) => ({
      id: node.path,
      name: node.name,
      path: node.path,
      fileCount: countItemsRecursively(node),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))

  const folderTracks = [...currentNode.tracks].sort((a, b) =>
    (a.title || a.filename || "").localeCompare(b.title || b.filename || "", undefined, {
      sensitivity: "base",
    })
  )

  return {
    folders,
    tracks: folderTracks,
    breadcrumbs: buildBreadcrumbs(currentNode.path),
  }
}
