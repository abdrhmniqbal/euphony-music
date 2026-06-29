import { Text, View } from "react-native"
import { SortSheet } from "@/components/blocks/sheets/sort-sheet"
import { useTranslation } from "react-i18next"
import type { LibrarySortOption, LibraryTab } from "./use-library-home-state"

interface LibraryHeaderProps {
  activeTab: LibraryTab
  itemCount: number
  getLibraryTabLabel: (tab: LibraryTab) => string
  currentSortOptions: LibrarySortOption[]
  sortLabel: string
}

export function LibraryHeader({
  activeTab,
  itemCount,
  getLibraryTabLabel,
  currentSortOptions,
  sortLabel,
}: LibraryHeaderProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-row items-center justify-between px-4 pb-4">
      <Text className="text-lg font-bold text-foreground">
        {activeTab === "Folders"
          ? t("library.items", { count: itemCount })
          : `${itemCount} ${getLibraryTabLabel(activeTab)}`}
      </Text>
      {currentSortOptions.length > 0 && <SortSheet.Trigger label={sortLabel} iconSize={16} />}
    </View>
  )
}
