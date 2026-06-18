import { Image } from "expo-image"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated"
import Transition from "react-native-screen-transitions"

import LocalNextSolidIcon from "@/components/icons/local/next-solid"
import LocalPauseSolidIcon from "@/components/icons/local/pause-solid"
import LocalPlaySolidIcon from "@/components/icons/local/play-solid"
import { MarqueeText } from "@/components/ui/marquee-text"
import { playNext, togglePlayback } from "@/modules/player/controls"
import { useCurrentTrack, useIsPlaying, usePlaybackProgressState } from "@/modules/player/selectors"
import { resolvePlayerTransitionId } from "@/modules/player/transition"
import { useThemeColors } from "@/modules/ui/theme"
import { setPlayerExpandedView } from "@/modules/ui/store"

import LocalMusicNoteSolidIcon from "../icons/local/music-note-solid"
import LocalQueueIcon from "../icons/local/queue"

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
        <LocalMusicNoteSolidIcon fill="none" width={20} height={20} color={mutedColor} />
      )}
    </View>
  )
}

interface MiniPlayerMetaProps {
  title: string
  artist?: string | null
}

function MiniPlayerMeta({ title, artist }: MiniPlayerMetaProps) {
  const { t } = useTranslation()

  return (
    <View className="flex-1 overflow-hidden">
      <MarqueeText text={title} className="text-[15px] font-bold text-foreground" speed={0.6} />
      <MarqueeText
        text={artist || t("library.unknownArtist")}
        className="text-[13px] text-muted"
        speed={0.5}
      />
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
      <PressableFeedback onPress={() => togglePlayback()} className="p-2 active:opacity-60">
        {isPlaying ? (
          <LocalPauseSolidIcon fill="none" width={28} height={28} color={foregroundColor} />
        ) : (
          <LocalPlaySolidIcon fill="none" width={28} height={28} color={foregroundColor} />
        )}
      </PressableFeedback>
      <PressableFeedback onPress={() => playNext()} className="p-2 active:opacity-60">
        <LocalNextSolidIcon fill="none" width={24} height={24} color={foregroundColor} />
      </PressableFeedback>
      <PressableFeedback onPress={onOpenQueue} className="p-2 active:opacity-60">
        <LocalQueueIcon fill="none" width={22} height={22} color={foregroundColor} />
      </PressableFeedback>
    </View>
  )
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ bottomOffset = 90 }) => {
  const router = useRouter()
  const currentTrack = useCurrentTrack()
  const isPlaying = useIsPlaying()

  const theme = useThemeColors()

  if (!currentTrack) return null

  const transitionId = resolvePlayerTransitionId({
    trackId: currentTrack.id,
    title: currentTrack.title,
  })

  const openFullPlayer = (initialView: "artwork" | "queue") => {
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
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(300)}
      className="absolute right-0 left-0 h-16"
      style={{
        bottom: bottomOffset,
      }}
    >
      <View
        className="absolute inset-0 border-t border-border bg-surface-secondary"
        style={{ borderTopColor: theme.border }}
      />

      <MiniPlayerProgress themeAccent={theme.accent} />

      <View className="flex-1 flex-row items-center gap-3 px-4">
        <BoundaryPressableFeedback
          key={currentTrack.id}
          id={transitionId}
          onPress={() => {
            openFullPlayer("artwork")
          }}
          className="flex-1 flex-row items-center gap-3 active:opacity-80"
        >
          <MiniPlayerArtwork image={currentTrack.image} mutedColor={theme.muted} />
          <MiniPlayerMeta title={currentTrack.title} artist={currentTrack.artist} />
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
