import type { StyleProp, ViewStyle } from "react-native"

import type { Track } from "@/modules/player/player.store"
import {
  FolderList,
  type Folder,
  type FolderBreadcrumb,
} from "@/components/blocks/folder-list"

interface FolderTabProps {
  folders: Folder[]
  folderTracks: Track[]
  folderBreadcrumbs: FolderBreadcrumb[]
  onOpenFolder: (path: string) => void
  onBackFolder: () => void
  onNavigateToFolderPath: (path: string) => void
  onTrackPress: (track: Track) => void
  contentContainerStyle?: StyleProp<ViewStyle>
  resetScrollKey?: string
}

export function FolderTab({
  folders,
  folderTracks,
  folderBreadcrumbs,
  onOpenFolder,
  onBackFolder,
  onNavigateToFolderPath,
  onTrackPress,
  contentContainerStyle,
  resetScrollKey,
}: FolderTabProps) {
  return (
    <FolderList
      data={folders}
      tracks={folderTracks}
      breadcrumbs={folderBreadcrumbs}
      onFolderPress={(folder) => {
        if (folder.path) {
          onOpenFolder(folder.path)
        }
      }}
      onBackPress={onBackFolder}
      onBreadcrumbPress={onNavigateToFolderPath}
      onTrackPress={onTrackPress}
      contentContainerStyle={contentContainerStyle}
      resetScrollKey={resetScrollKey}
    />
  )
}
