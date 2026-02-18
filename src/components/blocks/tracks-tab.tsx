import * as React from "react"

import type { DBTrack } from "@/types/database"
import { useThemeColors } from "@/hooks/use-theme-colors"
import type { SortConfig } from "@/modules/library/library-sort.store"
import type { Track } from "@/modules/player/player.store"
import { useTracks } from "@/modules/tracks/tracks.queries"
import { transformDBTrackToTrack } from "@/utils/transformers"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import { LibrarySkeleton } from "@/components/blocks/library-skeleton"
import { TrackList } from "@/components/blocks/track-list"
import { EmptyState } from "@/components/ui"

interface TracksTabProps {
  onTrackPress?: (track: Track) => void
  sortConfig?: SortConfig
}

export const TracksTab: React.FC<TracksTabProps> = ({
  onTrackPress,
  sortConfig,
}) => {
  const theme = useThemeColors()
  const orderByField =
    sortConfig?.field === "filename" ? "title" : sortConfig?.field || "title"
  const order = sortConfig?.order || "asc"

  const {
    data: dbTracks = [],
    isLoading,
    isPending,
  } = useTracks({
    sortBy: orderByField as any,
    sortOrder: order,
  })

  const tracks = (dbTracks as DBTrack[]).map(transformDBTrackToTrack)

  const handleTrackPress = (track: Track) => {
    onTrackPress?.(track)
  }

  if (isLoading || isPending) {
    return <LibrarySkeleton type="tracks" />
  }

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={
          <LocalMusicNoteSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        title="No Tracks"
        message="Tracks you add to your library will appear here."
      />
    )
  }

  return (
    <TrackList data={tracks} onTrackPress={handleTrackPress} />
  )
}
