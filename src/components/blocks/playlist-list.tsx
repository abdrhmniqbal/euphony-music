import * as React from "react"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list"
import type { StyleProp, ViewStyle } from "react-native"

import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalAddIcon from "@/components/icons/local/add"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import LocalPlaylistSolidIcon from "@/components/icons/local/playlist-solid"
import { PlaylistArtwork } from "@/components/patterns"
import {
  EmptyState,
  Item,
  ItemAction,
  ItemContent,
  ItemDescription,
  ItemImage,
  ItemTitle,
} from "@/components/ui"

export interface Playlist {
  id: string
  title: string
  trackCount: number
  image?: string
  images?: string[]
}

type PlaylistListRow =
  | { id: string; rowType: "create" }
  | (Playlist & { rowType: "playlist" })

interface PlaylistListProps {
  data: Playlist[]
  onPlaylistPress?: (playlist: Playlist) => void
  onCreatePlaylist?: () => void
  scrollEnabled?: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
}

export const PlaylistList: React.FC<PlaylistListProps> = ({
  data,
  onPlaylistPress,
  onCreatePlaylist,
  scrollEnabled = true,
  contentContainerStyle,
}) => {
  const theme = useThemeColors()

  const handlePress = (playlist: Playlist) => {
    onPlaylistPress?.(playlist)
  }

  const handleCreate = () => {
    onCreatePlaylist?.()
  }

  const formatTrackCount = (count: number) =>
    `${count} ${count === 1 ? "track" : "tracks"}`

  const renderCreateButton = () => (
    <Item key="create" onPress={handleCreate}>
      <ItemImage className="items-center justify-center bg-surface">
        <LocalAddIcon
          fill="none"
          width={24}
          height={24}
          color={theme.foreground}
        />
      </ItemImage>
      <ItemContent>
        <ItemTitle>New Playlist</ItemTitle>
      </ItemContent>
    </Item>
  )

  const renderPlaylistItem = (item: Playlist) => (
    <Item key={item.id} onPress={() => handlePress(item)}>
      <ItemImage className="items-center justify-center overflow-hidden bg-default">
        <PlaylistArtwork
          images={
            item.images && item.images.length > 0
              ? item.images
              : item.image
                ? [item.image]
                : undefined
          }
        />
      </ItemImage>
      <ItemContent>
        <ItemTitle>{item.title}</ItemTitle>
        <ItemDescription>{formatTrackCount(item.trackCount)}</ItemDescription>
      </ItemContent>
      <ItemAction>
        <LocalChevronRightIcon
          fill="none"
          width={24}
          height={24}
          color={theme.muted}
        />
      </ItemAction>
    </Item>
  )

  if (data.length === 0) {
    return (
      <LegendList
        data={[{ id: "create", rowType: "create" }]}
        renderItem={() => renderCreateButton()}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.rowType}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={[{ gap: 8 }, contentContainerStyle]}
        recycleItems={true}
        initialContainerPoolRatio={3}
        ListEmptyComponent={
          <EmptyState
            icon={
              <LocalPlaylistSolidIcon
                fill="none"
                width={48}
                height={48}
                color={theme.muted}
              />
            }
            title="No Playlists"
            message="Create your first playlist to organize your music."
          />
        }
        estimatedItemSize={68}
        drawDistance={180}
        style={{ flex: 1, minHeight: 1 }}
      />
    )
  }

  const listData: PlaylistListRow[] = [
    { id: "create", rowType: "create" },
    ...data.map((playlist) => ({ ...playlist, rowType: "playlist" as const })),
  ]

  return (
    <LegendList
      data={listData}
      renderItem={({ item }: LegendListRenderItemProps<PlaylistListRow>) => {
        if (item.rowType === "create") {
          return renderCreateButton()
        }
        return renderPlaylistItem(item)
      }}
      keyExtractor={(item) => item.id}
      getItemType={(item) => item.rowType}
      scrollEnabled={scrollEnabled}
      contentContainerStyle={[{ gap: 8 }, contentContainerStyle]}
      recycleItems={true}
      initialContainerPoolRatio={3}
      estimatedItemSize={68}
      drawDistance={180}
      style={{ flex: 1, minHeight: 1 }}
    />
  )
}
