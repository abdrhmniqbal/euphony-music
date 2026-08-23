import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { cn } from "tailwind-variants"

import LocalMic01Icon from "@/components/icons/local/mic-01"
import LocalPlaylist03Icon from "@/components/icons/local/playlist-03"
import LocalMic01SolidIcon from "@/components/icons/local/mic-01-solid"
import LocalPlaylist03SolidIcon from "@/components/icons/local/playlist-03-solid"
import { togglePlayerExpandedView, useUIStore } from "@/core/ui/store"
import { useThemeColors } from "@/core/theme/use-theme-colors"

export const PlayerFooter: React.FC = () => {
  const playerExpandedView = useUIStore((state) => state.playerExpandedView)
  const theme = useThemeColors()

  return (
    <View className="flex-row items-center justify-between py-2">
      <PressableFeedback
        onPress={() => togglePlayerExpandedView("lyrics")}
        className={cn(playerExpandedView !== "lyrics" && "opacity-60")}
      >
        {playerExpandedView === "lyrics" ? (
          <LocalMic01SolidIcon fill="none" width={24} height={24} color={theme.accent} />
        ) : (
          <LocalMic01Icon fill="none" width={24} height={24} color="white" />
        )}
      </PressableFeedback>
      <PressableFeedback
        onPress={() => togglePlayerExpandedView("queue")}
        className={cn(playerExpandedView !== "queue" && "opacity-60")}
      >
        {playerExpandedView === "queue" ? (
          <LocalPlaylist03SolidIcon fill="none" width={24} height={24} color={theme.accent} />
        ) : (
          <LocalPlaylist03Icon fill="none" width={24} height={24} color="white" />
        )}
      </PressableFeedback>
    </View>
  )
}
