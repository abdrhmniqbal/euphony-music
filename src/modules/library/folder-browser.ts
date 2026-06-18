import type { Folder, FolderBreadcrumb } from "@/components/blocks/folder-list"
import type { SortConfig, SortOrder } from "@/modules/library/sort-types"
import type { Track } from "@/modules/player/types"

interface FolderNode {
  name: string
  path: string
  children: Map<string, FolderNode>
  tracks: Track[]
}

export interface FolderBrowserState {
  folders: Folder[]
  tracks: Track[]
  breadcrumbs: FolderBreadcrumb[]
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

function getTrackDirectorySegments(track: Track): string[] {
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

function buildFolderTree(tracks: Track[]): FolderNode {
  const root: FolderNode = {
    name: "root",
    path: "",
    children: new Map<string, FolderNode>(),
    tracks: [],
  }

  for (const track of tracks) {
    const fullSegments = getTrackDirectorySegments(track)
    const segments = trimDeviceRootSegments(fullSegments)
    let current = root

    for (const segmentKey of segments) {
      const existing = current.children.get(segmentKey)
      if (existing) {
        current = existing
        continue
      }

      const nextPath = current.path ? `${current.path}/${segmentKey}` : segmentKey
      const nextNode: FolderNode = {
        name: decodePathSegment(segmentKey),
        path: nextPath,
        children: new Map<string, FolderNode>(),
        tracks: [],
      }
      current.children.set(segmentKey, nextNode)
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

  const segments = path.split("/").filter(Boolean)
  let current = root

  for (const segment of segments) {
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
    count += 1
    count += countItemsRecursively(child)
  }

  return count
}

function buildBreadcrumbs(path: string): FolderBreadcrumb[] {
  if (!path) {
    return []
  }

  const segments = path.split("/").filter(Boolean)
  const breadcrumbs: FolderBreadcrumb[] = []
  let currentPath = ""

  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment
    breadcrumbs.push({
      name: decodePathSegment(segment),
      path: currentPath,
    })
  }

  return breadcrumbs
}

function compareNumbers(a: number, b: number, order: SortOrder): number {
  if (a === b) {
    return 0
  }

  if (order === "asc") {
    return a < b ? -1 : 1
  }

  return a > b ? -1 : 1
}

function compareText(a: string, b: string, order: SortOrder): number {
  const result = a.localeCompare(b, undefined, { sensitivity: "base" })
  return order === "asc" ? result : -result
}

function getLatestDateAdded(node: FolderNode): number {
  let latest = 0

  for (const track of node.tracks) {
    const dateAdded = track.dateAdded || 0
    if (dateAdded > latest) {
      latest = dateAdded
    }
  }

  for (const child of node.children.values()) {
    const childLatest = getLatestDateAdded(child)
    if (childLatest > latest) {
      latest = childLatest
    }
  }

  return latest
}

function sortFolderItems(
  items: Array<Folder & { latestDateAdded: number }>,
  sortConfig: SortConfig
): Array<Folder & { latestDateAdded: number }> {
  const { field, order } = sortConfig

  return [...items].sort((a, b) => {
    if (field === "trackCount") {
      return compareNumbers(a.fileCount, b.fileCount, order)
    }

    if (field === "dateAdded") {
      return compareNumbers(a.latestDateAdded, b.latestDateAdded, order)
    }

    return compareText(a.name, b.name, order)
  })
}

function sortFolderTracks(tracks: Track[], sortConfig: SortConfig): Track[] {
  const { field, order } = sortConfig

  return [...tracks].sort((a, b) => {
    if (field === "dateAdded") {
      return compareNumbers(a.dateAdded || 0, b.dateAdded || 0, order)
    }

    return compareText(a.title || a.filename || "", b.title || b.filename || "", order)
  })
}

export function getParentFolderPath(path: string): string {
  if (!path) {
    return ""
  }

  const segments = path.split("/").filter(Boolean)
  segments.pop()
  return segments.join("/")
}

export function buildFolderBrowserState(
  tracks: Track[],
  currentPath: string,
  sortConfig: SortConfig
): FolderBrowserState {
  const root = buildFolderTree(tracks)
  const currentNode = getNodeByPath(root, currentPath)

  const folders = sortFolderItems(
    Array.from(currentNode.children.values()).map((node) => ({
      id: node.path,
      name: node.name,
      path: node.path,
      fileCount: countItemsRecursively(node),
      latestDateAdded: getLatestDateAdded(node),
    })),
    sortConfig
  ).map(({ latestDateAdded: _latestDateAdded, ...folder }) => folder)

  return {
    folders,
    tracks: sortFolderTracks(currentNode.tracks, sortConfig),
    breadcrumbs: buildBreadcrumbs(currentNode.path),
  }
}
