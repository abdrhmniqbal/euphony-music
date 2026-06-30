import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import * as React from "react"
import { useCallback, useMemo } from "react"
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native"
import { useTranslation } from "react-i18next"
import Transition from "react-native-screen-transitions"
import { CollectionActionSheet } from "@/components/blocks/sheets/collection-action-sheet"
import { LEGEND_LIST_ROW_CONFIG } from "@/components/blocks/legend-list-config"
import { useActionSheet } from "@/components/blocks/use-action-sheet"
import { useLegendListBehavior } from "@/components/blocks/use-legend-list-behavior"
import LocalAdd01Icon from "@/components/icons/local/add-01"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import LocalPlaylist02SolidIcon from "@/components/icons/local/playlist-02-solid"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import { EmptyState } from "@/components/ui/empty-state"
import {
  MediaItem as Item,
  MediaItemAction as ItemAction,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { resolvePlaylistTransitionId } from "@/modules/artists/artist-transition"
import { useThemeColors } from "@/modules/ui/theme"

export interface Playlist {
  id: string
  title: string
  trackCount: number
  image?: string
  images?: string[]
}

type PlaylistListRow = { id: string; rowType: "create" } | (Playlist & { rowType: "playlist" })

import { useAutoHideHeaderScroll } from "@/modules/ui/use-auto-hide-header-scroll"

interface PlaylistListProps {
  data: Playlist[]
  onPlaylistPress?: (playlist: Playlist) => void
  onPlaylistLongPress?: (playlist: Playlist) => void
  onCreatePlaylist?: () => void
  scrollEnabled?: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
  resetScrollKey?: string
  refreshControl?: React.ReactElement<RefreshControlProps> | null
}

export const PlaylistList: React.FC<PlaylistListProps> = ({
  data,
  onPlaylistPress,
  onPlaylistLongPress,
  onCreatePlaylist,
  scrollEnabled = true,
  contentContainerStyle,
  resetScrollKey,
  refreshControl,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey)
  const {
    selected: selectedPlaylist,
    isOpen: isSheetOpen,
    handleLongPress,
    closeSheet,
  } = useActionSheet<Playlist>()
  const autoHideScrollProps = useAutoHideHeaderScroll()
  const listContentContainerStyle = StyleSheet.flatten([{ gap: 8 }, contentContainerStyle])

  const handlePress = useCallback(
    (playlist: Playlist) => {
      onPlaylistPress?.(playlist)
    },
    [onPlaylistPress]
  )

  const handleCreate = useCallback(() => {
    onCreatePlaylist?.()
  }, [onCreatePlaylist])

  const renderCreateButton = useCallback(
    () => (
      <Item key="create" onPress={handleCreate}>
        <ItemImage className="items-center justify-center bg-surface">
          <LocalAdd01Icon fill="none" width={24} height={24} color={theme.foreground} />
        </ItemImage>
        <ItemContent>
          <ItemTitle>{t("playlist.newPlaylist")}</ItemTitle>
        </ItemContent>
      </Item>
    ),
    [handleCreate, t, theme.foreground]
  )

  const renderPlaylistItem = useCallback(
    (item: Playlist) => (
      <Item
        key={item.id}
        boundaryId={resolvePlaylistTransitionId({ id: item.id, title: item.title })}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      >
        <Transition.Boundary.Target>
          <ItemImage className="items-center justify-center overflow-hidden bg-default">
            <PlaylistArtwork images={resolvePlaylistArtworkImages(item.images, item.image)} />
          </ItemImage>
        </Transition.Boundary.Target>
        <ItemContent>
          <ItemTitle>{item.title}</ItemTitle>
          <ItemDescription>{t("library.count.track", { count: item.trackCount })}</ItemDescription>
        </ItemContent>
        <ItemAction>
          <LocalChevronRightIcon fill="none" width={24} height={24} color={theme.muted} />
        </ItemAction>
      </Item>
    ),
    [handleLongPress, handlePress, theme.muted, t]
  )

  const listData: PlaylistListRow[] = useMemo(
    () => [
      { id: "create", rowType: "create" },
      ...data.map((playlist) => ({
        ...playlist,
        rowType: "playlist" as const,
      })),
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

  const emptyFooter = useMemo(
    () =>
      data.length === 0 ? (
        <EmptyState
          icon={<LocalPlaylist02SolidIcon fill="none" width={48} height={48} color={theme.muted} />}
          title={t("library.empty.playlistsTitle")}
          message={t("library.empty.playlistsMessage")}
        />
      ) : null,
    [data.length, t, theme.muted]
  )

  return (
    <View style={{ flex: 1 }}>
      <LegendList
        ref={listRef}
        {...listBehaviorProps}
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.rowType}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={listContentContainerStyle}
        {...autoHideScrollProps}
        scrollEventThrottle={16}
        refreshControl={refreshControl || undefined}
        {...LEGEND_LIST_ROW_CONFIG}
        ListFooterComponent={emptyFooter}
        style={{ flex: 1, minHeight: 1 }}
      />
      <CollectionActionSheet
        visible={isSheetOpen && Boolean(selectedPlaylist)}
        onOpenChange={(open) => {
          if (!open) {
            closeSheet()
          }
        }}
        type="playlist"
        id={selectedPlaylist?.id ?? ""}
        name={selectedPlaylist?.title ?? ""}
        subtitle={
          selectedPlaylist
            ? t("library.count.track", { count: selectedPlaylist.trackCount })
            : undefined
        }
        image={selectedPlaylist?.image}
        images={selectedPlaylist?.images}
        trackCount={selectedPlaylist?.trackCount ?? 0}
      />
    </View>
  )
}
