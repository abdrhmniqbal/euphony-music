import type { NativeScrollEvent, NativeSyntheticEvent, RefreshControlProps } from "react-native"
import type { SortConfig } from "@/modules/library/sort-types"

import type { Track } from "@/modules/player/store"
import type { DBTrack } from "@/types/database"
import * as React from "react"
import { useTranslation } from "react-i18next"
import { LibraryTabState } from "@/components/blocks/library-tab-state"
import { TrackList } from "@/components/blocks/track-list"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { sortTracks } from "@/modules/library/sort-utils"
import { useTracks } from "@/modules/tracks/queries"
import { useThemeColors } from "@/modules/ui/theme"
import { transformDBTrackToTrack } from "@/utils/transformers"

interface TracksTabProps {
  onTrackPress?: (track: Track, queue: Track[]) => void
  sortConfig?: SortConfig
  contentBottomPadding?: number
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

export const TracksTab: React.FC<TracksTabProps> = ({
  onTrackPress,
  sortConfig,
  contentBottomPadding = 0,
  refreshControl,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()

  const { data: dbTracks = [] } = useTracks()

  const tracks = React.useMemo(
    () => (dbTracks as DBTrack[]).map(transformDBTrackToTrack),
    [dbTracks]
  )
  const effectiveSortConfig = React.useMemo<SortConfig>(
    () =>
      sortConfig ?? {
        field: "title",
        order: "asc",
      },
    [sortConfig]
  )
  const sortedTracks = React.useMemo(
    () => sortTracks(tracks, effectiveSortConfig),
    [tracks, effectiveSortConfig]
  )

  const handleTrackPress = React.useCallback(
    (track: Track) => {
      onTrackPress?.(track, sortedTracks)
    },
    [onTrackPress, sortedTracks]
  )

  return (
    <LibraryTabState
      hasData={tracks.length > 0}
      emptyIcon={
        <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
      }
      emptyTitle={t("library.empty.tracksTitle")}
      emptyMessage={t("library.empty.tracksMessage")}
    >
      <TrackList
        data={sortedTracks}
        onTrackPress={handleTrackPress}
        contentContainerStyle={{ paddingBottom: contentBottomPadding }}
        resetScrollKey={`${effectiveSortConfig.field}-${effectiveSortConfig.order}`}
        refreshControl={refreshControl}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
    </LibraryTabState>
  )
}
