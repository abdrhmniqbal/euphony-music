import * as React from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { LibraryTabBar } from "@/components/blocks/library-tab-bar"
import { TracksTab } from "@/components/blocks/tracks-tab"
import { EmptyState } from "@/components/ui/empty-state"
import { getVisibleLibraryTabs, type LibraryTab } from "@/core/preferences/library-tabs"
import { usePreferenceStore } from "@/core/preferences/store"
import { useThemeColors } from "@/core/theme/use-theme-colors"

export default function LibraryScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()

  const libraryTabsConfig = usePreferenceStore((state) => state.libraryTabsConfig)
  const visibleTabs = React.useMemo(
    () => getVisibleLibraryTabs(libraryTabsConfig),
    [libraryTabsConfig]
  )
  const [activeTab, setActiveTab] = React.useState<LibraryTab>(visibleTabs[0] ?? "Tracks")

  if (!visibleTabs.includes(activeTab)) {
    setActiveTab(visibleTabs[0] ?? "Tracks")
  }

  return (
    <View className="flex-1 bg-background">
      <LibraryTabBar tabs={visibleTabs} activeTab={activeTab} onActiveTabChange={setActiveTab} />
      <View className="flex-1 px-0">
        {activeTab === "Tracks" ? (
          <TracksTab contentBottomPadding={32} />
        ) : (
          <EmptyState
            icon={
              <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
            }
            title={t("library.comingSoonTitle")}
            message={t("library.comingSoonMessage")}
          />
        )}
      </View>
    </View>
  )
}
