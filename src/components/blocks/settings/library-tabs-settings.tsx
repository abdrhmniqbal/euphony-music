import { Checkbox, ListGroup, PressableFeedback, Separator, useThemeColor } from "heroui-native"
import React, { useCallback } from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalDragDropVerticalIcon from "@/components/icons/local/drag-drop-vertical"
import { DragList, useDragStart, useIsDraggingItem } from "@/components/patterns/drag-list"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { LibraryTab, LibraryTabSettingsItem } from "@/core/preferences/library-tabs"

function reorderItems<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

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
  const startDrag = useDragStart()
  const isActive = useIsDraggingItem(index)

  return (
    <>
      {index > 0 && <Separator className="mx-4" />}
      <ListGroup.Item
        style={{
          backgroundColor: isActive ? border : "transparent",
          opacity: isActive ? 0.9 : 1,
        }}
      >
        <PressableFeedback
          onPressIn={() => startDrag(index)}
          hitSlop={15}
          className="p-1"
        >
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
  const handleReorder = useCallback((from: number, to: number) => {
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

  return (
    <View className="flex-1 bg-background px-4 py-4">
      <ListGroup>
        <DragList
          data={libraryTabsConfig.tabs}
          onReordered={handleReorder}
          renderItem={renderItem}
          keyExtractor={(item, index) => item?.id ?? `tab-${index}`}
          estimatedItemSize={57}
          scrollEnabled={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingBottom: 0 }}
        />
      </ListGroup>
    </View>
  )
}
