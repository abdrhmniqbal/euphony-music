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

import LocalMicIcon from "@/components/icons/local/mic"
import LocalQueueIcon from "@/components/icons/local/queue"
import { togglePlayerExpandedView, useUIStore } from "@/modules/ui/store"
import { useThemeColors } from "@/modules/ui/theme"

export const PlayerFooter: React.FC = () => {
  const playerExpandedView = useUIStore((state) => state.playerExpandedView)
  const theme = useThemeColors()

  return (
    <View className="flex-row items-center justify-between py-2">
      <PressableFeedback
        onPress={() => togglePlayerExpandedView("lyrics")}
        className={cn(playerExpandedView !== "lyrics" && "opacity-60")}
      >
        <LocalMicIcon
          fill="none"
          width={24}
          height={24}
          color={playerExpandedView === "lyrics" ? theme.accent : "white"}
        />
      </PressableFeedback>
      <PressableFeedback
        onPress={() => togglePlayerExpandedView("queue")}
        className={cn(playerExpandedView !== "queue" && "opacity-60")}
      >
        <LocalQueueIcon
          fill="none"
          width={24}
          height={24}
          color={playerExpandedView === "queue" ? theme.accent : "white"}
        />
      </PressableFeedback>
    </View>
  )
}
