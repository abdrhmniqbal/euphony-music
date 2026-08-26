import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { PressableFeedback, useThemeColor } from "heroui-native"
import * as React from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, Text, View } from "react-native"

import LocalChevronLeftIcon from "@/components/icons/local/chevron-left"
import LocalChevronRightIcon from "@/components/icons/local/chevron-right"
import LocalFolder01SolidIcon from "@/components/icons/local/folder-01-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import {
  buildFolderBrowserState,
  getParentFolderPath,
  type FolderBreadcrumb,
  type FolderEntry,
} from "@/domains/library/folder-browser"
import { useTracks } from "@/domains/tracks/queries"
import { toPlayerTracks } from "@/playback/player-track"
import { playTrackList } from "@/playback/track-list-actions"
import { getPreferenceState } from "@/core/preferences/store"
import type { PlayerTrack } from "@/playback/types"
import { MediaItem } from "@/components/ui/media-item"

type FolderListItem =
  | { id: string; type: "breadcrumb" }
  | { id: string; type: "folder"; folder: FolderEntry }
  | { id: string; type: "track"; track: PlayerTrack }

export function FoldersTab({ contentBottomPadding }: { contentBottomPadding: number }) {
  const muted = useThemeColor("muted")
  const [foreground] = useThemeColor(["foreground"])
  const { t } = useTranslation()
  const [currentPath, setCurrentPath] = useState("")
  const { data } = useTracks()

  const playerTracks = React.useMemo(
    () => toPlayerTracks(data ?? [], getPreferenceState().splitMultipleValueConfig),
    [data]
  )
  const browser = React.useMemo(
    () => buildFolderBrowserState(playerTracks, currentPath),
    [playerTracks, currentPath]
  )

  const listData = React.useMemo<FolderListItem[]>(
    () => [
      ...(browser.breadcrumbs.length > 0
        ? [{ id: "__breadcrumbs", type: "breadcrumb" as const }]
        : []),
      ...browser.folders.map((folder) => ({
        id: `folder-${folder.id}`,
        type: "folder" as const,
        folder,
      })),
      ...browser.tracks.map((track) => ({
        id: `track-${track.id}`,
        type: "track" as const,
        track,
      })),
    ],
    [browser]
  )

  const renderBreadcrumbs = () => (
    <View className="mb-2 flex-row items-center gap-2">
      <PressableFeedback
        onPress={() => setCurrentPath(getParentFolderPath(currentPath))}
        className="p-1"
        hitSlop={8}
      >
        <LocalChevronLeftIcon fill="none" width={16} height={16} color={foreground} />
      </PressableFeedback>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-center gap-2">
          <PressableFeedback onPress={() => setCurrentPath("")} hitSlop={4}>
            <Text className="max-w-24 text-sm text-muted" numberOfLines={1} ellipsizeMode="tail">
              {t("library.folders")}
            </Text>
          </PressableFeedback>
          {browser.breadcrumbs.map((breadcrumb: FolderBreadcrumb) => (
            <View key={breadcrumb.path} className="flex-row items-center gap-2">
              <LocalChevronRightIcon fill="none" width={12} height={12} color={muted} />
              <PressableFeedback onPress={() => setCurrentPath(breadcrumb.path)} hitSlop={4}>
                <Text
                  className={
                    breadcrumb.path === currentPath
                      ? "max-w-28 text-sm text-foreground"
                      : "max-w-28 text-sm text-muted"
                  }
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {breadcrumb.name}
                </Text>
              </PressableFeedback>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )

  const renderItem = ({ item }: LegendListRenderItemProps<FolderListItem>) => {
    if (item.type === "breadcrumb") {
      return renderBreadcrumbs()
    }

    if (item.type === "folder") {
      return (
        <MediaItem onPress={() => setCurrentPath(item.folder.path)}>
          <MediaItem.Image
            icon={
              <LocalFolder01SolidIcon fill="none" width={24} height={24} color={muted} />
            }
          />
          <MediaItem.Content>
            <MediaItem.Title>{item.folder.name}</MediaItem.Title>
            <MediaItem.Description>
              {t("library.count.item", { count: item.folder.fileCount })}
            </MediaItem.Description>
          </MediaItem.Content>
          <MediaItem.Action>
            <LocalChevronRightIcon fill="none" width={24} height={24} color={muted} />
          </MediaItem.Action>
        </MediaItem>
      )
    }

    const folderTracks = browser.tracks
    const trackIndex = folderTracks.findIndex((track) => track.id === item.track.id)

    return (
      <MediaItem
        onPress={() =>
          playTrackList(folderTracks.slice(trackIndex), item.track.title)
        }
      >
        <MediaItem.Image
          image={item.track.image}
          icon={<LocalMusicNote04SolidIcon fill="none" width={20} height={20} color={muted} />}
        />
        <MediaItem.Content>
          <MediaItem.Title>{item.track.title}</MediaItem.Title>
          <MediaItem.Description>{item.track.artistName ?? ""}</MediaItem.Description>
        </MediaItem.Content>
      </MediaItem>
    )
  }

  return (
    <View className="flex-1 px-4">
      <LegendList
        data={listData}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.type}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        estimatedItemSize={72}
        style={{ flex: 1, minHeight: 1 }}
        ListEmptyComponent={
          <View className="items-center justify-center pt-16">
            <LocalFolder01SolidIcon fill="none" width={48} height={48} color={muted} />
            <Text className="mt-3 text-base font-bold text-foreground">
              {t("library.empty.foldersTitle")}
            </Text>
            <Text className="mt-1 text-center text-xs text-muted">
              {t("library.empty.foldersMessage")}
            </Text>
          </View>
        }
      />
    </View>
  )
}
