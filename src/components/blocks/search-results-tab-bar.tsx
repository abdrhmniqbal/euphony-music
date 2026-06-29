import { Chip } from "heroui-native"
import { useCallback } from "react"
import { Keyboard, ScrollView } from "react-native"
import { useTranslation } from "react-i18next"

export const SEARCH_TABS = ["All", "Track", "Album", "Artist", "Playlist"] as const
export type SearchTab = (typeof SEARCH_TABS)[number]

function getSearchTabLabel(tab: SearchTab, t: ReturnType<typeof useTranslation>["t"]) {
  switch (tab) {
    case "All":
      return t("search.tabs.all")
    case "Track":
      return t("search.tabs.track")
    case "Album":
      return t("search.tabs.album")
    case "Artist":
      return t("search.tabs.artist")
    case "Playlist":
      return t("search.tabs.playlist")
  }
}

interface SearchResultsTabBarProps {
  activeTab: SearchTab
  onActiveTabChange: (tab: SearchTab) => void
}

export function SearchResultsTabBar({ activeTab, onActiveTabChange }: SearchResultsTabBarProps) {
  const { t } = useTranslation()

  const setActiveTab = useCallback(
    (tab: SearchTab) => {
      onActiveTabChange(tab)
    },
    [onActiveTabChange]
  )

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={() => Keyboard.dismiss()}
      className="pt-3 pb-4"
      style={{ flexGrow: 0 }}
    >
      {SEARCH_TABS.map((tab) => (
        <Chip
          key={tab}
          onPress={() => setActiveTab(tab)}
          variant={activeTab === tab ? "primary" : "soft"}
          color={activeTab === tab ? "accent" : "default"}
          size="lg"
        >
          <Chip.Label className="font-medium">{getSearchTabLabel(tab, t)}</Chip.Label>
        </Chip>
      ))}
    </ScrollView>
  )
}
