/**
 * Purpose: Renders the expanded player footer actions for lyrics and queue views.
 * Caller: FullPlayerContent.
 * Dependencies: player expanded-view state, theme colors, footer action icons.
 * Main Functions: PlayerFooter().
 * Side Effects: Toggles expanded player view state.
 */

import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { cn } from "tailwind-variants"

import LocalMic01Icon from "@/components/icons/local/mic-01"
import { togglePlayerExpandedView, useUIStore } from "@/modules/ui/store"
import { useThemeColors } from "@/modules/ui/theme"
import LocalPlaylist03Icon from "@/components/icons/local/playlist-03"
import LocalMic01SolidIcon from "@/components/icons/local/mic-01-solid"
import LocalPlaylist03SolidIcon from "@/components/icons/local/playlist-03-solid"

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
          <LocalMic01SolidIcon
            fill="none"
            width={24}
            height={24}
            color={theme.accent}
          />
        ) : (
          <LocalMic01Icon
            fill="none"
            width={24}
            height={24}
            color="white"
          />
        )}
      </PressableFeedback>
      <PressableFeedback
        onPress={() => togglePlayerExpandedView("queue")}
        className={cn(playerExpandedView !== "queue" && "opacity-60")}
      >
        {playerExpandedView === "queue" ? (
          <LocalPlaylist03SolidIcon
            fill="none"
            width={24}
            height={24}
            color={theme.accent}
          />
        ) : (
        <LocalPlaylist03Icon
          fill="none"
          width={24}
          height={24}
          color="white"
        />
      )}
      </PressableFeedback>
    </View>
  )
}
