import { Tabs } from "heroui-native"
import { useTranslation } from "react-i18next"
import { cn } from "tailwind-variants"

import type { LibraryTab } from "@/core/preferences/library-tabs"
import { LIBRARY_TABS } from "@/core/preferences/library-tabs"

interface LibraryTabBarProps {
  tabs: LibraryTab[]
  activeTab: LibraryTab
  onActiveTabChange: (tab: LibraryTab) => void
}

export function getLibraryTabLabel(tab: LibraryTab, t: (key: string) => string) {
  switch (tab) {
    case "Tracks":
      return t("library.tracks")
    case "Albums":
      return t("library.albums")
    case "Artists":
      return t("library.artists")
    case "Genres":
      return t("library.genres")
    case "Playlists":
      return t("library.playlists")
    case "Folders":
      return t("library.folders")
    case "Favorites":
      return t("library.favorites")
  }
}

export function LibraryTabBar({ tabs, activeTab, onActiveTabChange }: LibraryTabBarProps) {
  const { t } = useTranslation()

  return (
    <Tabs
      value={activeTab}
      // SAFETY: the only rendered triggers come from tabs: LibraryTab[], so emitted values are always LibraryTab values
      onValueChange={(value) => onActiveTabChange(value as LibraryTab)}
      variant="secondary"
      className="gap-1.5 px-4 py-4"
    >
      <Tabs.List className="w-full">
        <Tabs.ScrollView
          scrollAlign="start"
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-1 gap-4"
        >
          <Tabs.Indicator />
          {tabs.map((tab) => (
            <Tabs.Trigger key={tab} value={tab} className="py-2">
              {({ isSelected }) => (
                <Tabs.Label
                  className={cn(
                    "text-xl font-semibold",
                    isSelected ? "text-foreground" : "text-muted"
                  )}
                >
                  {getLibraryTabLabel(tab, t)}
                </Tabs.Label>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.ScrollView>
      </Tabs.List>
    </Tabs>
  )
}

export type { LibraryTab }
export { LIBRARY_TABS }
