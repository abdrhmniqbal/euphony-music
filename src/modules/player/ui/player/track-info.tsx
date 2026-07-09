/**
 * Purpose: Renders current track title, artist text, and library favorite toggle on the full player.
 * Caller: FullPlayerContent.
 * Dependencies: favorite query/mutation hooks, localization, marquee text, local favorite icons, player track type.
 * Main Functions: TrackInfo()
 * Side Effects: Toggles favorite state for indexed library tracks.
 */

import type { Track } from "@/modules/player/store"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, { Layout } from "react-native-reanimated"

import { cn } from "tailwind-variants"
import LocalFavouriteIcon from "@/modules/shared/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/modules/shared/components/icons/local/favourite-solid"
import { MarqueeText } from "@/modules/shared/components/ui/marquee-text"
import { useIsFavorite } from "@/modules/favorites/queries"
import { useToggleFavorite } from "@/modules/favorites/mutations"
import { useThemeColors } from "@/modules/ui/theme"
import { useSettingsStore } from "@/modules/settings/store"
import {
  formatArtistsForDisplay,
  splitArtistsValue,
} from "@/modules/settings/split-multiple-values"

interface TrackInfoProps {
  track: Track
  compact?: boolean
  onPressArtist?: () => void
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ track, compact = false, onPressArtist }) => {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const canFavoriteTrack = track.isExternal !== true
  const { data: isFavoriteQuery = track.isFavorite ?? false } = useIsFavorite(
    "track",
    canFavoriteTrack ? track.id : ""
  )
  const toggleFavoriteMutation = useToggleFavorite()
  const isFavorite = Boolean(isFavoriteQuery)
  const splitMultipleValueConfig = useSettingsStore((state) => state.splitMultipleValueConfig)
  const titleClassName = cn("mb-1 font-bold text-white", compact ? "text-xl" : "text-2xl")
  const artistClassName = cn("text-white/60", compact ? "text-base" : "text-lg")

  const artistName = React.useMemo(() => {
    if (!track.rawArtistName && !track.artist) {
      return t("library.unknownArtist")
    }
    const rawArtist = track.rawArtistName || track.artist || ""
    const splitNames = splitArtistsValue(rawArtist, splitMultipleValueConfig)
    return formatArtistsForDisplay(rawArtist, splitNames, splitMultipleValueConfig.artistSplitMode)
  }, [track.rawArtistName, track.artist, splitMultipleValueConfig, t])

  const isArtistPressable = Boolean(onPressArtist && track.artist?.trim())

  return (
    <Animated.View
      layout={Layout.duration(300)}
      className={`flex-row items-center justify-between ${compact ? "mb-3" : "mb-6"}`}
    >
      <View className="mr-4 flex-1">
        <MarqueeText text={track.title} className={titleClassName} />
        {isArtistPressable ? (
          <PressableFeedback onPress={onPressArtist} hitSlop={8}>
            <MarqueeText text={artistName} className={artistClassName} />
          </PressableFeedback>
        ) : (
          <MarqueeText text={artistName} className={artistClassName} />
        )}
      </View>
      {canFavoriteTrack ? (
        <PressableFeedback
          onPress={() => {
            void toggleFavoriteMutation.mutateAsync({
              type: "track",
              itemId: track.id,
              isCurrentlyFavorite: isFavorite,
              name: track.title,
              subtitle: track.artist,
              image: track.image,
            })
          }}
        >
          {isFavorite ? (
            <LocalFavouriteSolidIcon fill="none" width={24} height={24} color={theme.danger} />
          ) : (
            <LocalFavouriteIcon fill="none" width={24} height={24} color="white" />
          )}
        </PressableFeedback>
      ) : null}
    </Animated.View>
  )
}
