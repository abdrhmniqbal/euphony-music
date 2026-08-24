import type { PlayerTrack } from "@/playback/types"
import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, { Layout } from "react-native-reanimated"

import { PressableFeedback, useThemeColor } from "heroui-native"
import { cn } from "tailwind-variants"
import { MarqueeText } from "@/components/ui/marquee-text"
import LocalFavouriteIcon from "@/components/icons/local/favourite"
import LocalFavouriteSolidIcon from "@/components/icons/local/favourite-solid"
import { useIsFavorite } from "@/domains/favorites/queries"
import { useToggleFavorite } from "@/domains/favorites/mutations"

interface TrackInfoProps {
  track: PlayerTrack
  compact?: boolean
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ track, compact = false }) => {
  const { t } = useTranslation()
  const danger = useThemeColor("danger")
  const canFavoriteTrack = track.isExternal !== true
  const { data: isFavoriteQuery = false } = useIsFavorite("track", canFavoriteTrack ? track.id : "")
  const toggleFavoriteMutation = useToggleFavorite()
  const isFavorite = Boolean(isFavoriteQuery)
  const titleClassName = cn("mb-1 font-bold text-white", compact ? "text-xl" : "text-2xl")
  const artistClassName = cn("text-white/60", compact ? "text-base" : "text-lg")
  const artistName = track.artist?.trim() || t("library.unknownArtist")

  return (
    <Animated.View
      layout={Layout.duration(300)}
      className={`mt-auto flex-row items-center justify-between ${compact ? "mb-3" : "mb-6"}`}
    >
      <View className="mr-4 flex-1">
        <MarqueeText text={track.title} className={titleClassName} />
        <MarqueeText text={artistName} className={artistClassName} />
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
            <LocalFavouriteSolidIcon fill="none" width={24} height={24} color={danger} />
          ) : (
            <LocalFavouriteIcon fill="none" width={24} height={24} color="#ffffff" />
          )}
        </PressableFeedback>
      ) : null}
    </Animated.View>
  )
}
