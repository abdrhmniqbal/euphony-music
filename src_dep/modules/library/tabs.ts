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

export function sanitizeLibraryTabsConfig(config: unknown): LibraryTabsConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}
  const rawTabs = Array.isArray(source.tabs) ? source.tabs : []
  const seen = new Set<LibraryTab>()
  const tabs: LibraryTabSettingsItem[] = []

  for (const entry of rawTabs) {
    if (!entry || typeof entry !== "object") continue
    const item = entry as { id?: unknown; visible?: unknown }
    if (!LIBRARY_TABS.includes(item.id as LibraryTab)) continue
    const id = item.id as LibraryTab
    if (seen.has(id)) continue
    tabs.push({ id, visible: item.visible !== false })
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

// A library with no visible tabs renders a blank home screen (it keys off the
// first visible tab). Enforce at least one visible tab before persisting.
export function ensureAtLeastOneVisibleTab(config: LibraryTabsConfig): LibraryTabsConfig {
  if (config.tabs.some((tab) => tab.visible)) return config
  const tabs = config.tabs.length
    ? config.tabs
    : getDefaultLibraryTabsConfig().tabs
  return { tabs: [{ ...tabs[0], visible: true }, ...tabs.slice(1)] }
}
