import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { Text } from "react-native"
import type { SyncedLyricsLine } from "@/modules/lyrics/lrc-parser"
import { seekTo } from "@/modules/player/controls"

export const SyncedLyrics: React.FC<{
  lines: SyncedLyricsLine[]
  activeSyncedLineIndex: number
  fontScale: number
  onLayoutLine: (id: string, y: number) => void
}> = ({ lines, activeSyncedLineIndex, fontScale, onLayoutLine }) => {
  return lines.map((line, index) => {
    const isActive = index === activeSyncedLineIndex
    const isPast = activeSyncedLineIndex >= 0 && index < activeSyncedLineIndex

    return (
      <PressableFeedback
        key={line.id}
        onPress={() => {
          void seekTo(line.time)
        }}
        className="py-1 active:opacity-85"
        onLayout={(event) => onLayoutLine(line.id, event.nativeEvent.layout.y)}
      >
        <Text
          selectable={false}
          style={{
            color: isActive
              ? "rgba(255,255,255,0.96)"
              : isPast
                ? "rgba(255,255,255,0.48)"
                : "rgba(255,255,255,0.22)",
            fontSize: (isActive ? 22 : 18) * fontScale,
            lineHeight: (isActive ? 34 : 28) * fontScale,
            fontWeight: isActive ? "700" : "600",
            letterSpacing: 0,
          }}
        >
          {line.text}
        </Text>
      </PressableFeedback>
    )
  })
}
