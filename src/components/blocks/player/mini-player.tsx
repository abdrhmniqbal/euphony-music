import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, { useAnimatedStyle, withTiming, useDerivedValue } from "react-native-reanimated"
import Transition from "react-native-screen-transitions"

import LocalNextSolidIcon from "@/components/icons/local/next-solid"
import LocalPauseSolidIcon from "@/components/icons/local/pause-solid"
import LocalPlaySolidIcon from "@/components/icons/local/play-solid"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalPlaylist03Icon from "@/components/icons/local/playlist-03"
import { MarqueeText } from "@/components/ui/marquee-text"
import { playNext, togglePlayback } from "@/playback/controls"
import { useCurrentTrack, useIsPlaying, usePlaybackProgressState } from "@/playback/selectors"
import type { PlayerTrack } from "@/playback/types"
import { setPlayerExpandedView } from "@/core/ui/store"
import { useThemeColors } from "@/core/theme/use-theme-colors"

const BoundaryPressableFeedback = Transition.createBoundaryComponent(PressableFeedback)

interface MiniPlayerProps {
  bottomOffset?: number
}

interface MiniPlayerArtworkProps {
  image?: string
  mutedColor: string
}

function MiniPlayerArtwork({ image, mutedColor }: MiniPlayerArtworkProps) {
  return (
    <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-md bg-surface">
      {image ? (
        <Image
          source={{ uri: image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <LocalMusicNote04SolidIcon fill="none" width={20} height={20} color={mutedColor} />
      )}
    </View>
  )
}

function MiniPlayerMeta({ title, artist }: { title: string; artist?: string | null }) {
  const { t } = useTranslation()
  const artistName = artist?.trim() || t("library.unknownArtist")

  return (
    <View className="flex-1 overflow-hidden">
      <MarqueeText text={title} className="text-[15px] font-bold text-foreground" speed={0.6} />
      <MarqueeText text={artistName} className="text-[13px] text-muted" speed={0.5} />
    </View>
  )
}

interface MiniPlayerControlsProps {
  isPlaying: boolean
  foregroundColor: string
  onOpenQueue: () => void
}

function MiniPlayerControls({ isPlaying, foregroundColor, onOpenQueue }: MiniPlayerControlsProps) {
  return (
    <View className="flex-row items-center gap-3">
      <PressableFeedback onPress={() => void togglePlayback()} className="p-2 active:opacity-60">
        {isPlaying ? (
          <LocalPauseSolidIcon fill="none" width={28} height={28} color={foregroundColor} />
        ) : (
          <LocalPlaySolidIcon fill="none" width={28} height={28} color={foregroundColor} />
        )}
      </PressableFeedback>
      <PressableFeedback onPress={() => void playNext()} className="p-2 active:opacity-60">
        <LocalNextSolidIcon fill="none" width={24} height={24} color={foregroundColor} />
      </PressableFeedback>
      <PressableFeedback onPress={onOpenQueue} className="p-2 active:opacity-60">
        <LocalPlaylist03Icon fill="none" width={22} height={22} color={foregroundColor} />
      </PressableFeedback>
    </View>
  )
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ bottomOffset = 90 }) => {
  const router = useRouter()
  const currentTrack = useCurrentTrack()
  const isPlaying = useIsPlaying()
  const theme = useThemeColors()

  const [lastTrack, setLastTrack] = React.useState<PlayerTrack | null>(null)
  React.useEffect(() => {
    if (currentTrack) {
      setLastTrack(currentTrack)
    }
  }, [currentTrack])

  const displayTrack = currentTrack || lastTrack

  const isVisible = !!currentTrack
  const translateY = useDerivedValue(() => {
    return withTiming(isVisible ? 0 : 100, { duration: 300 })
  }, [isVisible])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: withTiming(isVisible ? 1 : 0, { duration: 300 }),
    }
  })

  if (!displayTrack) return null

  const transitionId = `track-${displayTrack.id}`

  const openFullPlayer = (initialView: "artwork" | "queue") => {
    if (!currentTrack) return
    setPlayerExpandedView(initialView)
    router.push({
      pathname: "/player",
      params: {
        initialView,
        transitionId,
      },
    })
  }

  return (
    <Animated.View
      pointerEvents={isVisible ? "auto" : "none"}
      className="absolute right-0 left-0 h-17"
      style={[
        {
          bottom: bottomOffset,
        },
        animatedStyle,
      ]}
    >
      <View
        className="absolute inset-0 border-t border-border bg-surface-secondary"
        style={{ borderTopColor: theme.border }}
      />

      <MiniPlayerProgress themeAccent={theme.accent} />

      <View className="flex-1 flex-row items-center gap-3 px-4">
        <BoundaryPressableFeedback
          key={displayTrack.id}
          id={transitionId}
          onPress={() => {
            openFullPlayer("artwork")
          }}
          className="flex-1 flex-row items-center gap-3 active:opacity-80"
        >
          <MiniPlayerArtwork image={displayTrack.image} mutedColor={theme.muted} />
          <MiniPlayerMeta title={displayTrack.title} artist={displayTrack.artist} />
        </BoundaryPressableFeedback>

        <MiniPlayerControls
          isPlaying={isPlaying}
          foregroundColor={theme.foreground}
          onOpenQueue={() => {
            openFullPlayer("queue")
          }}
        />
      </View>
    </Animated.View>
  )
}

function MiniPlayerProgress({ themeAccent }: { themeAccent: string }) {
  const { currentTime, duration } = usePlaybackProgressState()
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <View className="absolute top-0 right-0 left-0 h-0.75 bg-surface-tertiary">
      <View
        style={{
          width: `${progressPercent}%`,
          height: "100%",
          backgroundColor: themeAccent,
        }}
      />
    </View>
  )
}
