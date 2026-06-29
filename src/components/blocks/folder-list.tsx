import type { Track } from "@/modules/player/store"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { Button, PressableFeedback } from "heroui-native"
import * as React from "react"

import {
  type RefreshControlProps,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native"
import { useTranslation } from "react-i18next"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { LEGEND_LIST_ROW_CONFIG } from "@/components/blocks/legend-list-config"
import { useActionSheet } from "@/components/blocks/use-action-sheet"
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import LocalChevronLeftIcon from "@/components/icons/local/chevron-left"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import LocalFolder01SolidIcon from "@/components/icons/local/folder-01-solid"
import { EmptyState } from "@/components/ui/empty-state"
import {
  MediaItem as Item,
  MediaItemAction as ItemAction,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { ICON_SIZES } from "@/constants/icon-sizes"
import { useThemeColors } from "@/modules/ui/theme"
import { formatDuration } from "@/utils/format"
import { mergeText } from "@/utils/merge-text"

import LocalMusicNote04SolidIcon from "../icons/local/music-note-04-solid"

import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"

export interface Folder {
  id: string
  name: string
  fileCount: number
  path?: string
}

export interface FolderBreadcrumb {
  name: string
  path: string
}

interface FolderListProps {
  data: Folder[]
  tracks?: Track[]
  breadcrumbs?: FolderBreadcrumb[]
  onFolderPress?: (folder: Folder) => void
  onTrackPress?: (track: Track) => void
  onBackPress?: () => void
  onBreadcrumbPress?: (path: string) => void
  contentContainerStyle?: StyleProp<ViewStyle>
  resetScrollKey?: string
  refreshControl?: React.ReactElement<RefreshControlProps> | null
}

type FolderListItem =
  | { id: string; type: "folder"; folder: Folder }
  | { id: string; type: "track"; track: Track }

export const FolderList: React.FC<FolderListProps> = ({
  data,
  tracks = [],
  breadcrumbs = [],
  onFolderPress,
  onTrackPress,
  onBackPress,
  onBreadcrumbPress,
  contentContainerStyle,
  resetScrollKey,
  refreshControl,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const { selected: selectedFolder, isOpen: isSheetOpen, handleLongPress, closeSheet } = useActionSheet<Folder>()
  const autoHideScrollProps = useAutoHideHeaderScroll()
  const listContentContainerStyle = StyleSheet.flatten([
    { gap: 8, paddingBottom: 16 },
    contentContainerStyle,
  ])

  const handlePress = React.useCallback(
    (folder: Folder) => {
      onFolderPress?.(folder)
    },
    [onFolderPress]
  )

  const handleTrackPress = React.useCallback(
    (track: Track) => {
      onTrackPress?.(track)
    },
    [onTrackPress]
  )

  const renderFolderItem = React.useCallback(
    (item: Folder) => (
      <Item
        key={item.id}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      >
        <ItemImage
          icon={
            <LocalFolder01SolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={theme.muted}
            />
          }
        />
        <ItemContent>
          <ItemTitle>{item.name}</ItemTitle>
          <ItemDescription>
            {t("library.count.item", { count: item.fileCount })}
          </ItemDescription>
        </ItemContent>
        <ItemAction>
          <LocalChevronRightIcon fill="none" width={24} height={24} color={theme.muted} />
        </ItemAction>
      </Item>
    ),
    [handleLongPress, handlePress, theme.muted, t]
  )

  const renderTrackItem = React.useCallback(
    (track: Track) => (
      <Item key={track.id} onPress={() => handleTrackPress(track)}>
        <ItemImage
          icon={
            <LocalMusicNote04SolidIcon
              fill="none"
              width={ICON_SIZES.listFallback}
              height={ICON_SIZES.listFallback}
              color={theme.muted}
            />
          }
          image={track.image}
        />
        <ItemContent>
          <ItemTitle>{track.title || track.filename || t("library.unknownTrack")}</ItemTitle>
          <ItemDescription>
            {mergeText([
              track.artist || t("library.unknownArtist"),
              formatDuration(track.duration || 0),
            ])}
          </ItemDescription>
        </ItemContent>
      </Item>
    ),
    [handleTrackPress, theme.muted, t]
  )

  const hasEntries = data.length > 0 || tracks.length > 0
  const hasNestedPath = breadcrumbs.length > 0
  const renderItem = React.useCallback(
    ({ item }: LegendListRenderItemProps<FolderListItem>) =>
      item.type === "folder" ? renderFolderItem(item.folder) : renderTrackItem(item.track),
    [renderFolderItem, renderTrackItem]
  )

  const listData: FolderListItem[] = [
    ...data.map((folder) => ({
      id: `folder-${folder.id}`,
      type: "folder" as const,
      folder,
    })),
    ...tracks.map((track) => ({
      id: `track-${track.id}`,
      type: "track" as const,
      track,
    })),
  ]

  if (!hasEntries) {
    return (
      <EmptyState
        icon={<LocalFolder01SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
        title={t("library.empty.foldersTitle")}
        message={t("library.empty.foldersMessage")}
      />
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <LegendList
        ref={listRef}
        {...listBehaviorProps}
        data={listData}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.type}
        renderItem={renderItem}
        contentContainerStyle={listContentContainerStyle}
        {...autoHideScrollProps}
        scrollEventThrottle={16}
        refreshControl={refreshControl || undefined}
        {...LEGEND_LIST_ROW_CONFIG}
        style={{ flex: 1, minHeight: 1 }}
        ListHeaderComponent={
          hasNestedPath ? (
            <View className="mb-2">
              <View className="mb-2 flex-row items-center gap-2">
                <Button onPress={onBackPress} variant="secondary" className="h-8 w-8" isIconOnly>
                  <LocalChevronLeftIcon
                    fill="none"
                    width={16}
                    height={16}
                    color={theme.foreground}
                  />
                </Button>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ alignItems: "center", gap: 8 }}
                >
                  <PressableFeedback onPress={() => onBreadcrumbPress?.("")} className="max-w-24">
                    <Text className="text-sm text-muted" numberOfLines={1} ellipsizeMode="tail">
                      Folders
                    </Text>
                  </PressableFeedback>
                  {breadcrumbs.map((breadcrumb) => (
                    <View key={breadcrumb.path} className="flex-row items-center gap-2">
                      <LocalChevronRightIcon
                        fill="none"
                        width={12}
                        height={12}
                        color={theme.foreground}
                      />
                      <PressableFeedback
                        onPress={() => onBreadcrumbPress?.(breadcrumb.path)}
                        className="max-w-28"
                      >
                        <Text
                          className="text-sm text-foreground"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {breadcrumb.name}
                        </Text>
                      </PressableFeedback>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : null
        }
      />
      <CollectionActionSheet
        visible={isSheetOpen && Boolean(selectedFolder)}
        onOpenChange={(open) => {
          if (!open) {
            closeSheet()
          }
        }}
        type="folder"
        id={selectedFolder?.path ?? selectedFolder?.id ?? ""}
        name={selectedFolder?.name ?? ""}
        subtitle={selectedFolder ? t("library.count.item", { count: selectedFolder.fileCount }) : undefined}
        trackCount={selectedFolder?.fileCount ?? 0}
        hideFavoriteAction
      />
    </View>
  )
}
