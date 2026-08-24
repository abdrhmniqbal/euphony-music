import type { LegendListRenderItemProps } from "@legendapp/list/react-native"
import { LegendList } from "@legendapp/list/react-native"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"

import LocalAdd01Icon from "@/components/icons/local/add-01"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import LocalPlaylist02SolidIcon from "@/components/icons/local/playlist-02-solid"
import { CollectionActionSheet } from "@/components/blocks/collection-action-sheet"
import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"
import { EmptyState } from "@/components/ui/empty-state"
import {
  MediaItem,
  MediaItemAction,
  MediaItemContent,
  MediaItemDescription,
  MediaItemImage,
  MediaItemTitle,
} from "@/components/ui/media-item"
import { useAutoHideHeaderScroll } from "@/core/ui/use-auto-hide-header-scroll"
import { useThemeColors } from "@/core/theme/use-theme-colors"

export interface PlaylistListItem {
  id: string
  name: string
  trackCount: number
  image?: string
  images?: string[]
}

type PlaylistListRow = { id: string; rowType: "create" } | (PlaylistListItem & { rowType: "playlist" })

interface PlaylistListProps {
  data: PlaylistListItem[]
  onPlaylistPress?: (playlist: PlaylistListItem) => void
  onCreatePlaylist?: () => void
  contentContainerStyle?: StyleProp<ViewStyle>
}

export const PlaylistList: React.FC<PlaylistListProps> = ({
  data,
  onPlaylistPress,
  onCreatePlaylist,
  contentContainerStyle,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const autoHideScrollProps = useAutoHideHeaderScroll()
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistListItem | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleLongPress = useCallback((playlist: PlaylistListItem) => {
    setSelectedPlaylist(playlist)
    setIsSheetOpen(true)
  }, [])

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false)
  }, [])

  const renderCreateButton = useCallback(
    () => (
      <MediaItem key="create" onPress={onCreatePlaylist}>
        <MediaItemImage className="items-center justify-center bg-surface">
          <LocalAdd01Icon fill="none" width={24} height={24} color={theme.foreground} />
        </MediaItemImage>
        <MediaItemContent>
          <MediaItemTitle>{t("playlist.newPlaylist")}</MediaItemTitle>
        </MediaItemContent>
      </MediaItem>
    ),
    [onCreatePlaylist, t, theme.foreground]
  )

  const renderPlaylistItem = useCallback(
    (item: PlaylistListItem) => (
      <MediaItem onPress={() => onPlaylistPress?.(item)} onLongPress={() => handleLongPress(item)}>
        <MediaItemImage className="items-center justify-center overflow-hidden bg-default">
          <PlaylistArtwork images={item.images ?? (item.image ? [item.image] : undefined)} />
        </MediaItemImage>
        <MediaItemContent>
          <MediaItemTitle>{item.name}</MediaItemTitle>
          <MediaItemDescription>{t("library.count.track", { count: item.trackCount })}</MediaItemDescription>
        </MediaItemContent>
        <MediaItemAction>
          <LocalChevronRightIcon fill="none" width={24} height={24} color={theme.muted} />
        </MediaItemAction>
      </MediaItem>
    ),
    [handleLongPress, onPlaylistPress, t, theme.muted]
  )

  const listData: PlaylistListRow[] = useMemo(
    () => [
      { id: "create", rowType: "create" },
      ...data.map((playlist) => ({ ...playlist, rowType: "playlist" as const })),
    ],
    [data]
  )

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<PlaylistListRow>) => {
      if (item.rowType === "create") {
        return renderCreateButton()
      }
      return renderPlaylistItem(item)
    },
    [renderCreateButton, renderPlaylistItem]
  )

  return (
    <View style={{ flex: 1 }}>
      <LegendList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.rowType}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={StyleSheet.flatten([
          { paddingHorizontal: 16, gap: 8 },
          contentContainerStyle,
        ])}
        {...autoHideScrollProps}
        recycleItems
        estimatedItemSize={72}
        ListEmptyComponent={
          null
        }
        style={{ flex: 1, minHeight: 1 }}
      />
      {data.length === 0 ? (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center px-8">
          <EmptyState
            icon={<LocalPlaylist02SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
            title={t("library.empty.playlistsTitle")}
            message={t("library.empty.playlistsMessage")}
          />
        </View>
      ) : null}
      <CollectionActionSheet
        visible={isSheetOpen && Boolean(selectedPlaylist)}
        onOpenChange={(open) => {
          if (!open) {
            closeSheet()
          }
        }}
        type="playlist"
        id={selectedPlaylist?.id ?? ""}
        name={selectedPlaylist?.name ?? ""}
        subtitle={
          selectedPlaylist ? t("library.count.track", { count: selectedPlaylist.trackCount }) : undefined
        }
        image={selectedPlaylist?.image}
        images={selectedPlaylist?.images}
        trackCount={selectedPlaylist?.trackCount ?? 0}
      />
    </View>
  )
}
