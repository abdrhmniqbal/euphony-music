/**
 * Purpose: Renders paired playback shortcuts for playing a full collection or shuffling it.
 * Caller: Track-based route screens and media detail headers.
 * Dependencies: HeroUI Native buttons, local playback icons, theme colors.
 * Main Functions: PlaybackActionsRow()
 * Side Effects: Invokes playback callbacks provided by parent routes.
 */

import { Button } from "heroui-native"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { cn } from "tailwind-variants"

import { useThemeColors } from "@/modules/ui/theme"

import LocalPlaySolidIcon from "../icons/local/play-solid"
import LocalShuffleSolidIcon from "../icons/local/shuffle-solid"

interface PlaybackActionsRowProps {
  onPlay: () => void
  onShuffle: () => void
  className?: string
}

export function PlaybackActionsRow({ onPlay, onShuffle, className }: PlaybackActionsRowProps) {
  const { t } = useTranslation()
  const theme = useThemeColors()

  return (
    <View className={cn("mb-8 flex-row gap-3", className)}>
      <Button
        className="flex-1 rounded-[22px] border border-border/60 bg-default/65"
        variant="secondary"
        size="lg"
        onPress={onPlay}
      >
        <LocalPlaySolidIcon fill="none" width={20} height={20} color={theme.foreground} />
        <Text className="text-base font-semibold tracking-[0.1px] text-foreground">
          {t("common.playAll")}
        </Text>
      </Button>
      <Button
        className="flex-1 rounded-[22px] border border-border/60 bg-default/45"
        variant="secondary"
        size="lg"
        onPress={onShuffle}
      >
        <LocalShuffleSolidIcon fill="none" width={24} height={24} color={theme.foreground} />
        <Text numberOfLines={1} className="text-base font-semibold text-foreground">
          {t("common.shuffle")}
        </Text>
      </Button>
    </View>
  )
}
