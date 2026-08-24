/* oxlint-disable anti-slop/no-unknown-parameters -- stored-preference boundary: config arrives unparsed from persistence */
import { isRecord } from "@/lib/guards"

export const LIBRARY_TABS = [
  "Tracks",
  "Albums",
  "Artists",
  "Genres",
  "Playlists",
  "Folders",
  "Favorites",
] as const

export type LibraryTab = (typeof LIBRARY_TABS)[number]

export interface LibraryTabSettingsItem {
  id: LibraryTab
  visible: boolean
}

export interface LibraryTabsConfig {
  tabs: LibraryTabSettingsItem[]
}

export function getDefaultLibraryTabsConfig(): LibraryTabsConfig {
  return { tabs: LIBRARY_TABS.map((id) => ({ id, visible: true })) }
}

function isLibraryTabId(value: unknown): value is LibraryTab {
  return LIBRARY_TABS.some((tab) => tab === value)
}

export function sanitizeLibraryTabsConfig(config: unknown): LibraryTabsConfig {
  const source = isRecord(config) ? config : {}
  const rawTabs = Array.isArray(source.tabs) ? source.tabs : []
  const seen = new Set<LibraryTab>()
  const tabs: LibraryTabSettingsItem[] = []

  for (const entry of rawTabs) {
    if (!isRecord(entry)) continue
    if (!isLibraryTabId(entry.id)) continue
    const id = entry.id
    if (seen.has(id)) continue
    tabs.push({ id, visible: entry.visible !== false })
    seen.add(id)
  }

  for (const id of LIBRARY_TABS) {
    if (!seen.has(id)) tabs.push({ id, visible: true })
  }
  return { tabs }
}

export function getVisibleLibraryTabs(config: LibraryTabsConfig): LibraryTab[] {
  return sanitizeLibraryTabsConfig(config)
    .tabs.filter((tab) => tab.visible)
    .map((tab) => tab.id)
}
