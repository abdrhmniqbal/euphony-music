import { Image } from "expo-image"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { useRouter } from "expo-router"
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
import { useThemeColor } from "heroui-native"

const BoundaryPressableFeedback = Transition.createBoundaryComponent(PressableFeedback)

const SHOW_HIDE_DURATION_MS = 300

interface MiniPlayerProps {
  bottomOffset?: number
}

function MiniPlayerArtwork({ image }: { image?: string }) {
  const muted = useThemeColor("muted")

  return (
    <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-md bg-surface">
      {image ? (
        <Image
          source={{ uri: image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <LocalMusicNote04SolidIcon fill="none" width={20} height={20} color={muted} />
      )}
    </View>
  )
}

function MiniPlayerMeta({ track }: { track: PlayerTrack }) {
  const { t } = useTranslation()
  const artistName = track.artist?.trim() || t("library.unknownArtist")

  return (
    <View className="flex-1 overflow-hidden">
      <MarqueeText
        text={track.title}
        className="text-[15px] font-bold text-foreground"
        speed={0.6}
      />
      <MarqueeText text={artistName} className="text-[13px] text-muted" speed={0.5} />
    </View>
  )
}

interface MiniPlayerControlsProps {
  isPlaying: boolean
  onOpenQueue: () => void
}

function MiniPlayerControls({ isPlaying, onOpenQueue }: MiniPlayerControlsProps) {
  const foreground = useThemeColor("foreground")

  return (
    <View className="flex-row items-center gap-3">
      <PressableFeedback onPress={() => void togglePlayback()} className="p-2 active:opacity-60">
        {isPlaying ? (
          <LocalPauseSolidIcon fill="none" width={28} height={28} color={foreground} />
        ) : (
          <LocalPlaySolidIcon fill="none" width={28} height={28} color={foreground} />
        )}
      </PressableFeedback>
      <PressableFeedback onPress={() => void playNext()} className="p-2 active:opacity-60">
        <LocalNextSolidIcon fill="none" width={24} height={24} color={foreground} />
      </PressableFeedback>
      <PressableFeedback onPress={onOpenQueue} className="p-2 active:opacity-60">
        <LocalPlaylist03Icon fill="none" width={22} height={22} color={foreground} />
      </PressableFeedback>
    </View>
  )
}

function MiniPlayerProgress() {
  const { currentTime, duration } = usePlaybackProgressState()
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <View className="absolute top-0 right-0 left-0 h-0.75 bg-surface-tertiary">
      <View style={{ width: `${progressPercent}%`, height: "100%" }} className="bg-accent" />
    </View>
  )
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ bottomOffset = 90 }) => {
  const router = useRouter()
  const currentTrack = useCurrentTrack()
  const isPlaying = useIsPlaying()

  const [lastTrack, setLastTrack] = React.useState<PlayerTrack | null>(null)
  React.useEffect(() => {
    if (currentTrack) {
      // oxlint-disable-next-line react/set-state-in-effect -- retains the last track so the mini player animates out instead of unmounting instantly
      setLastTrack(currentTrack)
    }
  }, [currentTrack])

  const displayTrack = currentTrack || lastTrack
  const isVisible = !!currentTrack

  const translateY = useDerivedValue(() => {
    return withTiming(isVisible ? 0 : 100, { duration: SHOW_HIDE_DURATION_MS })
  }, [isVisible])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: withTiming(isVisible ? 1 : 0, { duration: SHOW_HIDE_DURATION_MS }),
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
      className="absolute right-0 left-0 h-17 border-t border-border bg-surface-secondary"
      style={[{ bottom: bottomOffset }, animatedStyle]}
    >
      <MiniPlayerProgress />

      <View className="flex-1 flex-row items-center gap-3 px-4">
        <BoundaryPressableFeedback
          key={displayTrack.id}
          id={transitionId}
          onPress={() => openFullPlayer("artwork")}
          className="flex-1 flex-row items-center gap-3 active:opacity-80"
        >
          <MiniPlayerArtwork image={displayTrack.image} />
          <MiniPlayerMeta track={displayTrack} />
        </BoundaryPressableFeedback>

        <MiniPlayerControls isPlaying={isPlaying} onOpenQueue={() => openFullPlayer("queue")} />
      </View>
    </Animated.View>
  )
}
