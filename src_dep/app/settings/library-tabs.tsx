import { Checkbox, ListGroup, PressableFeedback, Separator } from "heroui-native"
import React, { useCallback, useMemo } from "react"
import { View } from "react-native"
import ReorderableList, {
  reorderItems,
  useIsActive,
  useReorderableDrag,
} from "react-native-reorderable-list"
import { Gesture } from "react-native-gesture-handler"
import { useTranslation } from "react-i18next"

import LocalDragDropVerticalIcon from "@/modules/shared/components/icons/local/drag-drop-vertical"
import { useSettingsStore } from "@/modules/settings/store"
import { setLibraryTabsConfig } from "@/modules/settings/library-tabs"
import type { LibraryTabSettingsItem } from "@/modules/library/tabs"
import { useThemeColors } from "@/modules/ui/theme"

interface LibraryTabItemProps {
  item: LibraryTabSettingsItem
  index: number
  onToggle: (id: string, visible: boolean) => void
}

function LibraryTabItem({ item, index, onToggle }: LibraryTabItemProps) {
  const { t } = useTranslation()
  const theme = useThemeColors()
  const drag = useReorderableDrag()
  const isActive = useIsActive()

  const label = useMemo(() => {
    switch (item.id) {
      case "Tracks":
        return t("settings.library.tabsTracks")
      case "Albums":
        return t("settings.library.tabsAlbums")
      case "Artists":
        return t("settings.library.tabsArtists")
      case "Genres":
        return t("settings.library.tabsGenres")
      case "Playlists":
        return t("settings.library.tabsPlaylists")
      case "Folders":
        return t("settings.library.tabsFolders")
      case "Favorites":
        return t("settings.library.tabsFavorites")
      default:
        return item.id
    }
  }, [item.id, t])

  return (
    <>
      {index > 0 && <Separator className="mx-4" />}
      <ListGroup.Item
        style={{
          backgroundColor: isActive ? theme.border : "transparent",
          opacity: isActive ? 0.9 : 1,
        }}
      >
        <PressableFeedback onPressIn={drag} hitSlop={15} className="p-1">
          <LocalDragDropVerticalIcon width={20} height={20} color={theme.muted} />
        </PressableFeedback>
        <Checkbox
          isSelected={item.visible}
          onSelectedChange={(isSelected) => onToggle(item.id, isSelected)}
        />
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{label}</ListGroup.ItemTitle>
        </ListGroup.ItemContent>
      </ListGroup.Item>
    </>
  )
}

export default function LibraryTabsSettingsScreen() {
  const libraryTabsConfig = useSettingsStore((state) => state.libraryTabsConfig)
  const _theme = useThemeColors()

  const handleReorder = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      const nextTabs = reorderItems(libraryTabsConfig.tabs, from, to)
      void setLibraryTabsConfig({ tabs: nextTabs })
    },
    [libraryTabsConfig.tabs]
  )

  const handleToggle = useCallback(
    (id: string, visible: boolean) => {
      const nextTabs = libraryTabsConfig.tabs.map((tab: LibraryTabSettingsItem) =>
        tab.id === id ? { ...tab, visible } : tab
      )
      void setLibraryTabsConfig({ tabs: nextTabs })
    },
    [libraryTabsConfig.tabs]
  )

  const renderItem = useCallback(
    ({ item, index }: { item: LibraryTabSettingsItem; index: number }) => {
      if (!item) return null
      return <LibraryTabItem item={item} index={index} onToggle={handleToggle} />
    },
    [handleToggle]
  )

  const panGesture = useMemo(() => {
    return Gesture.Pan().activateAfterLongPress(200)
  }, [])

  return (
    <View className="flex-1 bg-background px-4 py-4">
      <ListGroup>
        <ReorderableList
          data={libraryTabsConfig.tabs}
          onReorder={handleReorder}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ?? `tab-${index}`}
          shouldUpdateActiveItem
          panGesture={panGesture}
          scrollEnabled={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingBottom: 0 }}
        />
      </ListGroup>
    </View>
  )
}
