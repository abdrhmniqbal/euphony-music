/**
 * Purpose: Renders a virtualized track list with playback-aware row state and actions.
 * Caller: Home, library, genre, playlist, and search route screens.
 * Dependencies: LegendList virtualization, player current-track selector, track action sheet.
 * Main Functions: TrackList()
 * Side Effects: Opens track action sheet and dispatches playback actions.
 */

import type { PlayerQueueContext, Track } from "@/modules/player/types"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import * as React from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"
import { LEGEND_LIST_ROW_CONFIG } from "@/modules/library/ui/legend-list-config"
import { TrackActionSheet } from "@/modules/tracks/ui/track-action-sheet"
import { useActionSheet } from "@/modules/shared/components/blocks/use-action-sheet"
import { useLegendListBehavior } from "@/modules/library/ui/use-legend-list-behavior"
import LocalMusicNote04SolidIcon from "@/modules/shared/components/icons/local/music-note-04-solid"
import { MemoizedTrackListItem } from "@/modules/tracks/ui/track-list-item"
import { EmptyState } from "@/modules/shared/components/ui/empty-state"
import { useCurrentTrackId } from "@/modules/player/selectors"
import { playTrack } from "@/modules/player/service"
import { useThemeColors } from "@/modules/ui/theme"

interface TrackListProps {
  data: Track[]
  onTrackPress?: (track: Track) => void
  showNumbers?: boolean
  hideCover?: boolean
  hideArtist?: boolean
  getNumber?: (track: Track, index: number) => number | string
  scrollEnabled?: boolean
  listHeader?: React.ReactElement | null
  listFooter?: React.ReactElement | null
  contentContainerStyle?: StyleProp<ViewStyle>
  showsVerticalScrollIndicator?: boolean
  scrollEventThrottle?: number
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  refreshControl?: React.ReactElement<RefreshControlProps> | null
  resetScrollKey?: string
  currentTrackId?: string
  playlistId?: string
  queueContext?: PlayerQueueContext | null
  renderItemPrefix?: (track: Track, index: number, data: Track[]) => React.ReactNode
}

export const TrackList: React.FC<TrackListProps> = ({
  data,
  onTrackPress,
  showNumbers = false,
  hideCover = false,
  hideArtist = false,
  getNumber,
  scrollEnabled = true,
  listHeader = null,
  listFooter = null,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  scrollEventThrottle = 16,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  refreshControl,
  resetScrollKey,
  currentTrackId,
  playlistId,
  queueContext,
  renderItemPrefix,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const {
    selected: selectedTrack,
    isOpen: isSheetOpen,
    handleLongPress,
    closeSheet,
  } = useActionSheet<Track>()
  const activeTrackId = currentTrackId ?? useCurrentTrackId() ?? undefined

  const handleSheetClose = useCallback(() => {
    closeSheet()
  }, [closeSheet])
  const { listRef, listBehaviorProps } = useLegendListBehavior(resetScrollKey, activeTrackId)
  const isCompactNumberedList = hideCover && showNumbers
  const estimatedItemSize = isCompactNumberedList ? 56 : 84
  const listContentContainerStyle = StyleSheet.flatten([
    { gap: isCompactNumberedList ? 0 : 8 },
    contentContainerStyle,
  ])

  const handleTrackPress = useCallback(
    (track: Track) => {
      if (onTrackPress) {
        onTrackPress(track)
        return
      }

      playTrack(track, data, queueContext ?? undefined)
    },
    [data, onTrackPress, queueContext]
  )

  const renderTrackItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<Track>) => (
      <MemoizedTrackListItem
        track={item}
        index={index}
        data={data}
        mutedColor={theme.muted}
        showNumbers={showNumbers}
        hideCover={hideCover}
        hideArtist={hideArtist}
        getNumber={getNumber}
        onTrackPress={handleTrackPress}
        onTrackLongPress={handleLongPress}
        renderItemPrefix={renderItemPrefix}
      />
    ),
    [
      data,
      getNumber,
      handleTrackPress,
      hideArtist,
      hideCover,
      renderItemPrefix,
      handleLongPress,
      showNumbers,
      theme.muted,
    ]
  )
  return (
    <View style={{ flex: 1 }}>
      <LegendList
        ref={listRef}
        {...listBehaviorProps}
        data={data}
        renderItem={renderTrackItem}
        keyExtractor={(item) => item.id}
        style={{ flex: 1, minHeight: 1 }}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          <EmptyState
            icon={
              <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
            }
            title={t("library.empty.tracksTitle")}
            message={t("library.empty.tracksMessage")}
          />
        }
        contentContainerStyle={listContentContainerStyle}
        onScroll={onScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={refreshControl || undefined}
        {...LEGEND_LIST_ROW_CONFIG}
        estimatedItemSize={estimatedItemSize}
      />
      <TrackActionSheet
        track={selectedTrack}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        tracks={data}
        playlistId={playlistId}
        queueContext={queueContext}
      />
    </View>
  )
}
