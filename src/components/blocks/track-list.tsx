import type { LegendListRenderItemProps } from "@legendapp/list/react-native"
import { LegendList } from "@legendapp/list/react-native"
import * as React from "react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import type { PlaybackQueueContext, PlayerTrack } from "@/playback/types"
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native"
import { PressableFeedback } from "heroui-native"

import LocalMoreHorizontalCircle01SolidIcon from "@/components/icons/local/more-horizontal-circle-01-solid"
import { TrackActionSheet } from "@/components/blocks/track-action-sheet"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { ScaleLoader } from "@/components/ui/scale-loader"
import { TrackRow } from "@/components/patterns/track-row"
import { useCurrentTrackId } from "@/playback/selectors"
import { playTrack } from "@/playback/service"
import { useThemeColors } from "@/core/theme/use-theme-colors"

interface TrackListProps {
  data: PlayerTrack[]
  onTrackPress?: (track: PlayerTrack) => void
  showNumbers?: boolean
  hideCover?: boolean
  hideArtist?: boolean
  getNumber?: (track: PlayerTrack, index: number) => number | string
  renderItemPrefix?: (track: PlayerTrack, index: number, data: PlayerTrack[]) => React.ReactNode
  scrollEnabled?: boolean
  listHeader?: React.ReactElement | null
  listFooter?: React.ReactElement | null
  contentContainerStyle?: Record<string, unknown>
  showsVerticalScrollIndicator?: boolean
  scrollEventThrottle?: number
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  refreshControl?: React.ReactElement<import("react-native").RefreshControlProps> | null
  currentTrackId?: string
  queueContext?: PlaybackQueueContext | null
}

interface TrackListItemProps {
  track: PlayerTrack
  index: number
  data: PlayerTrack[]
  mutedColor: string
  showNumbers: boolean
  hideCover: boolean
  hideArtist: boolean
  getNumber?: (track: PlayerTrack, index: number) => number | string
  isActive: boolean
  onTrackPress: (track: PlayerTrack) => void
  onTrackLongPress: (track: PlayerTrack) => void
  renderItemPrefix?: (track: PlayerTrack, index: number, data: PlayerTrack[]) => React.ReactNode
}

function TrackListItem({
  track,
  index,
  data,
  mutedColor,
  showNumbers,
  hideCover,
  hideArtist,
  getNumber,
  isActive,
  onTrackPress,
  onTrackLongPress,
  renderItemPrefix,
}: TrackListItemProps) {
  const handleActionPress = useCallback(
    (event: { stopPropagation: () => void }) => {
      event.stopPropagation()
      onTrackLongPress(track)
    },
    [onTrackLongPress, track]
  )
  const handlePress = useCallback(() => {
    onTrackPress(track)
  }, [onTrackPress, track])
  const handleLongPress = useCallback(() => {
    onTrackLongPress(track)
  }, [onTrackLongPress, track])
  const rank = showNumbers ? (getNumber ? getNumber(track, index) : index + 1) : undefined

  return (
    <>
      {renderItemPrefix?.(track, index, data) || null}
      <TrackRow
        track={track}
        onPress={handlePress}
        onLongPress={handleLongPress}
        rank={rank}
        showCover={!hideCover}
        showArtist={!hideArtist}
        titleClassName={isActive ? "text-accent" : undefined}
        imageOverlay={isActive ? <ScaleLoader size={16} /> : undefined}
        rightAction={
          <PressableFeedback onPress={handleActionPress} className="p-2">
            <LocalMoreHorizontalCircle01SolidIcon
              fill="none"
              width={24}
              height={24}
              color={mutedColor}
            />
          </PressableFeedback>
        }
      />
    </>
  )
}

const MemoizedTrackListItem = React.memo(TrackListItem)

export const TrackList: React.FC<TrackListProps> = ({
  data,
  onTrackPress,
  showNumbers = false,
  hideCover = false,
  hideArtist = false,
  getNumber,
  renderItemPrefix,
  scrollEnabled = true,
  listHeader = null,
  listFooter = null,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  scrollEventThrottle = 16,
  onScroll,
  refreshControl,
  currentTrackId,
  queueContext,
}) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const [selectedTrack, setSelectedTrack] = React.useState<PlayerTrack | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const activeTrackId = currentTrackId ?? useCurrentTrackId() ?? undefined

  const handleSheetClose = useCallback(() => {
    setIsSheetOpen(false)
  }, [])

  const handleLongPress = useCallback((track: PlayerTrack) => {
    setSelectedTrack(track)
    setIsSheetOpen(true)
  }, [])

  const handleTrackPress = useCallback(
    (track: PlayerTrack) => {
      if (onTrackPress) {
        onTrackPress(track)
        return
      }

      void playTrack(track, data, queueContext ?? undefined)
    },
    [data, onTrackPress, queueContext]
  )

  const isCompactNumberedList = hideCover && showNumbers

  const renderTrackItem = useCallback(
    ({ item, index }: LegendListRenderItemProps<PlayerTrack>) => (
      <MemoizedTrackListItem
        track={item}
        index={index}
        data={data}
        mutedColor={theme.muted}
        showNumbers={showNumbers}
        hideCover={hideCover}
        hideArtist={hideArtist}
        getNumber={getNumber}
        isActive={item.id === activeTrackId}
        onTrackPress={handleTrackPress}
        onTrackLongPress={handleLongPress}
        renderItemPrefix={renderItemPrefix}
      />
    ),
    [
      data,
      getNumber,
      handleTrackPress,
      handleLongPress,
      hideArtist,
      hideCover,
      renderItemPrefix,
      showNumbers,
      theme.muted,
      activeTrackId,
    ]
  )

  return (
    <View style={{ flex: 1 }}>
      <LegendList
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
        contentContainerStyle={StyleSheet.flatten([
          { gap: isCompactNumberedList ? 0 : 8 },
          contentContainerStyle as never,
        ])}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={refreshControl || undefined}
        recycleItems
        drawDistance={200}
        estimatedItemSize={84}
      />
      <TrackActionSheet track={selectedTrack} isOpen={isSheetOpen} onClose={handleSheetClose} />
    </View>
  )
}
