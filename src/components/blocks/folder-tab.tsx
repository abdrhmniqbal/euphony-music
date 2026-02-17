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
}

export function FolderTab({
  folders,
  folderTracks,
  folderBreadcrumbs,
  onOpenFolder,
  onBackFolder,
  onNavigateToFolderPath,
  onTrackPress,
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
    />
  )
}
