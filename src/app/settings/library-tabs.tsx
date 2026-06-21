import { Checkbox, PressableFeedback } from "heroui-native";
import React, { useCallback, useMemo } from "react";
import { Text, View } from "react-native";
import ReorderableList, {
  reorderItems,
  useIsActive,
  useReorderableDrag,
} from "react-native-reorderable-list";
import { Gesture } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

import LocalDragDropVerticalIcon from "@/components/icons/local/drag-drop-vertical";
import { useSettingsStore } from "@/modules/settings/store";
import { setLibraryTabsConfig } from "@/modules/settings/library-tabs";
import type {
  LibraryTabSettingsItem,
  LibraryTabsConfig,
} from "@/modules/library/tabs";
import { useThemeColors } from "@/modules/ui/theme";

interface LibraryTabItemProps {
  item: LibraryTabSettingsItem;
  onToggle: (id: string, visible: boolean) => void;
}

function LibraryTabItem({ item, onToggle }: LibraryTabItemProps) {
  const { t } = useTranslation();
  const theme = useThemeColors();
  const drag = useReorderableDrag();
  const isActive = useIsActive();

  const label = useMemo(() => {
    switch (item.id) {
      case "Tracks":
        return t("settings.library.tabsTracks");
      case "Albums":
        return t("settings.library.tabsAlbums");
      case "Artists":
        return t("settings.library.tabsArtists");
      case "Genres":
        return t("settings.library.tabsGenres");
      case "Playlists":
        return t("settings.library.tabsPlaylists");
      case "Folders":
        return t("settings.library.tabsFolders");
      case "Favorites":
        return t("settings.library.tabsFavorites");
      default:
        return item.id;
    }
  }, [item.id, t]);

  return (
    <View
      style={{
        backgroundColor: isActive ? theme.border : "transparent",
        opacity: isActive ? 0.9 : 1,
      }}
      className="flex-row items-center justify-between border-b border-border py-4"
    >
      <View className="flex-row items-center gap-3">
        <Checkbox
          isSelected={item.visible}
          onSelectedChange={(isSelected) => onToggle(item.id, isSelected)}
        />
        <Text className="text-base font-medium text-foreground">{label}</Text>
      </View>
      <PressableFeedback onPressIn={drag} hitSlop={15} className="p-2">
        <LocalDragDropVerticalIcon width={20} height={20} color={theme.muted} />
      </PressableFeedback>
    </View>
  );
}

export default function LibraryTabsSettingsScreen() {
  const libraryTabsConfig = useSettingsStore(
    (state) => state.libraryTabsConfig,
  ) as unknown as LibraryTabsConfig;
  const theme = useThemeColors();

  const handleReorder = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      const nextTabs = reorderItems(libraryTabsConfig.tabs, from, to);
      void setLibraryTabsConfig({ tabs: nextTabs });
    },
    [libraryTabsConfig.tabs],
  );

  const handleToggle = useCallback(
    (id: string, visible: boolean) => {
      const nextTabs = libraryTabsConfig.tabs.map(
        (tab: LibraryTabSettingsItem) =>
          tab.id === id ? { ...tab, visible } : tab,
      );
      void setLibraryTabsConfig({ tabs: nextTabs });
    },
    [libraryTabsConfig.tabs],
  );

  const renderItem = useCallback(
    ({ item }: { item: LibraryTabSettingsItem }) => (
      <LibraryTabItem item={item} onToggle={handleToggle} />
    ),
    [handleToggle],
  );

  const panGesture = useMemo(() => {
    return Gesture.Pan().activateAfterLongPress(200);
  }, []) as any;

  return (
    <View className="flex-1 bg-background px-4">
      <ReorderableList
        data={libraryTabsConfig.tabs}
        onReorder={handleReorder}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        shouldUpdateActiveItem
        panGesture={panGesture}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}
