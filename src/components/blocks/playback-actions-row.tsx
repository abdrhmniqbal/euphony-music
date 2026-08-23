import { Button } from "heroui-native"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { cn } from "tailwind-variants"

import LocalPlaySolidIcon from "@/components/icons/local/play-solid"
import LocalShuffleSolidIcon from "@/components/icons/local/shuffle-solid"
import { useThemeColors } from "@/core/theme/use-theme-colors"

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
