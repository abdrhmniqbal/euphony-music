import type { ReactNode } from "react"

import { View } from "react-native"
import { useTranslation } from "react-i18next"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import { MediaItem } from "@/components/ui/media-item"
import { ICON_SIZES } from "@/lib/layout"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import type { PlayerTrack } from "@/playback/types"

interface TrackRowProps {
  track: PlayerTrack
  onPress?: () => void
  onLongPress?: () => void
  variant?: "list" | "grid"
  leftAction?: ReactNode
  rank?: ReactNode
  showCover?: boolean
  showArtist?: boolean
  rightAction?: ReactNode
  className?: string
  imageClassName?: string
  imageOverlay?: ReactNode
  titleClassName?: string
  descriptionClassName?: string
}

export function TrackRow({
  track,
  onPress,
  onLongPress,
  variant = "list",
  leftAction,
  rank,
  showCover = true,
  showArtist = true,
  rightAction,
  className,
  imageClassName,
  imageOverlay,
  titleClassName,
  descriptionClassName,
}: TrackRowProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const isCompactNoCoverRow = !showCover && rank !== undefined && rank !== null
  const fallbackIconSize = variant === "grid" ? ICON_SIZES.gridFallback : ICON_SIZES.listFallback

  return (
    <MediaItem
      variant={variant}
      onPress={onPress}
      onLongPress={onLongPress}
      className={`${isCompactNoCoverRow ? "gap-1 py-0" : ""} ${className || ""}`}
    >
      {leftAction ? <View className="py-2 pr-1">{leftAction}</View> : null}
      {showCover ? (
        <MediaItem.Image
          icon={
            <LocalMusicNote04SolidIcon
              fill="none"
              width={fallbackIconSize}
              height={fallbackIconSize}
              color={theme.muted}
            />
          }
          image={track.image}
          className={imageClassName}
          overlay={imageOverlay}
        />
      ) : null}
      {rank !== undefined && rank !== null ? (
        <MediaItem.Rank className={isCompactNoCoverRow ? "w-6 text-left text-base" : ""}>
          {rank}
        </MediaItem.Rank>
      ) : null}
      <MediaItem.Content>
        <MediaItem.Title className={titleClassName}>{track.title}</MediaItem.Title>
        {showArtist ? (
          <MediaItem.Description className={descriptionClassName}>
            {track.artist || t("library.unknownArtist")}
          </MediaItem.Description>
        ) : null}
      </MediaItem.Content>
      {rightAction ? (
        <View className={isCompactNoCoverRow ? "p-0.5" : "p-2"}>{rightAction}</View>
      ) : null}
    </MediaItem>
  )
}
