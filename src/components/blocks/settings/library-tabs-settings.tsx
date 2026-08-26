import { Checkbox, ListGroup, PressableFeedback, Separator, useThemeColor } from "heroui-native"
import React, { useCallback, useMemo } from "react"
import { View } from "react-native"
import ReorderableList, {
  reorderItems,
  useIsActive,
  useReorderableDrag,
} from "react-native-reorderable-list"
import { Gesture } from "react-native-gesture-handler"
import { useTranslation } from "react-i18next"

import LocalDragDropVerticalIcon from "@/components/icons/local/drag-drop-vertical"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { LibraryTab, LibraryTabSettingsItem } from "@/core/preferences/library-tabs"

interface LibraryTabItemProps {
  item: LibraryTabSettingsItem
  index: number
  onToggle: (id: LibraryTab, visible: boolean) => void
}

const TAB_LABEL_KEYS = {
  Tracks: "library.tracks",
  Albums: "library.albums",
  Artists: "library.artists",
  Genres: "library.genres",
  Playlists: "library.playlists",
  Folders: "library.folders",
  Favorites: "library.favorites",
} satisfies Record<LibraryTab, string>

function LibraryTabItem({ item, index, onToggle }: LibraryTabItemProps) {
  const { t } = useTranslation()
  const [border, muted] = useThemeColor(["border", "muted"])
  const drag = useReorderableDrag()
  const isActive = useIsActive()

  return (
    <>
      {index > 0 && <Separator className="mx-4" />}
      <ListGroup.Item
        style={{
          backgroundColor: isActive ? border : "transparent",
          opacity: isActive ? 0.9 : 1,
        }}
      >
        <PressableFeedback onPressIn={drag} hitSlop={15} className="p-1">
          <LocalDragDropVerticalIcon fill="none" width={20} height={20} color={muted} />
        </PressableFeedback>
        <Checkbox
          isSelected={item.visible}
          onSelectedChange={(isSelected) => onToggle(item.id, isSelected)}
        />
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{t(TAB_LABEL_KEYS[item.id])}</ListGroup.ItemTitle>
        </ListGroup.ItemContent>
      </ListGroup.Item>
    </>
  )
}

export function LibraryTabsSettings() {
  const libraryTabsConfig = usePreferenceStore((state) => state.libraryTabsConfig)

  // react-native-reorderable-list caches per-cell offsets across data mutations
  // (omahili/react-native-reorderable-list#66); remount resets its measurements.
  const listResetKey = useMemo(
    () => libraryTabsConfig.tabs.map((tab) => `${tab.id}:${tab.visible}`).join("|"),
    [libraryTabsConfig.tabs]
  )

  const handleReorder = useCallback(({ from, to }: { from: number; to: number }) => {
    preferenceStore.setState((state) => ({
      libraryTabsConfig: { tabs: reorderItems(state.libraryTabsConfig.tabs, from, to) },
    }))
  }, [])

  const handleToggle = useCallback(
    (id: LibraryTab, visible: boolean) => {
      const nextTabs = libraryTabsConfig.tabs.map((tab) =>
        tab.id === id ? { ...tab, visible } : tab
      )
      preferenceStore.setState({ libraryTabsConfig: { tabs: nextTabs } })
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
          key={listResetKey}
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
