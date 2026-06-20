import type { Track } from "@/modules/player/store"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { Button, PressableFeedback } from "heroui-native"
import * as React from "react"

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import LocalChevronLeftIcon from "@/components/icons/local/chevron-left"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import LocalFolderSolidIcon from "@/components/icons/local/folder-solid"
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

import LocalMusicNoteSolidIcon from "../icons/local/music-note-solid"

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
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
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
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const [selectedFolder, setSelectedFolder] = React.useState<Folder | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const listContentContainerStyle = StyleSheet.flatten([
    { gap: 8, paddingBottom: 16 },
    contentContainerStyle,
  ])

  const handlePress = (folder: Folder) => {
    onFolderPress?.(folder)
  }

  const handleFolderLongPress = (folder: Folder) => {
    setSelectedFolder(folder)
    setIsSheetOpen(true)
  }

  const closeFolderSheet = () => {
    setIsSheetOpen(false)
  }

  const handleTrackPress = (track: Track) => {
    onTrackPress?.(track)
  }

  const formatItemCount = (count: number) => t("library.count.item", { count })

  const renderFolderItem = (item: Folder) => (
    <Item
      key={item.id}
      onPress={() => handlePress(item)}
      onLongPress={() => handleFolderLongPress(item)}
    >
      <ItemImage
        icon={
          <LocalFolderSolidIcon
            fill="none"
            width={ICON_SIZES.listFallback}
            height={ICON_SIZES.listFallback}
            color={theme.muted}
          />
        }
      />
      <ItemContent>
        <ItemTitle>{item.name}</ItemTitle>
        <ItemDescription>{formatItemCount(item.fileCount)}</ItemDescription>
      </ItemContent>
      <ItemAction>
        <LocalChevronRightIcon fill="none" width={24} height={24} color={theme.muted} />
      </ItemAction>
    </Item>
  )

  const renderTrackItem = (track: Track) => (
    <Item key={track.id} onPress={() => handleTrackPress(track)}>
      <ItemImage
        icon={
          <LocalMusicNoteSolidIcon
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
  )

  const hasEntries = data.length > 0 || tracks.length > 0
  const hasNestedPath = breadcrumbs.length > 0
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
        icon={<LocalFolderSolidIcon fill="none" width={48} height={48} color={theme.muted} />}
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
        renderItem={({ item }: LegendListRenderItemProps<FolderListItem>) =>
          item.type === "folder" ? renderFolderItem(item.folder) : renderTrackItem(item.track)
        }
        contentContainerStyle={listContentContainerStyle}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
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
            closeFolderSheet()
          }
        }}
        type="folder"
        id={selectedFolder?.path ?? selectedFolder?.id ?? ""}
        name={selectedFolder?.name ?? ""}
        subtitle={selectedFolder ? formatItemCount(selectedFolder.fileCount) : undefined}
        trackCount={selectedFolder?.fileCount ?? 0}
        hideFavoriteAction
      />
    </View>
  )
}
