import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { Text } from "react-native"
import type { SyncedLine } from "@/modules/lyrics"
import { seekTo } from "@/modules/player/controls"

export const SyncedLyrics: React.FC<{
  lines: SyncedLine[]
  activeIndex: number
  fontScale: number
  onLayoutLine: (id: string, y: number) => void
}> = ({ lines, activeIndex, fontScale, onLayoutLine }) => {
  return lines.map((line, index) => {
    const karaokeOn = activeIndex >= 0
    const isActive = karaokeOn && index === activeIndex
    const isPast = karaokeOn && index < activeIndex

    return (
      <PressableFeedback
        key={line.id}
        onPress={() => {
          void seekTo(line.time)
        }}
        className="active:opacity-85"
        style={{ paddingVertical: isActive ? 14 : 8 }}
        onLayout={(event) => onLayoutLine(line.id, event.nativeEvent.layout.y)}
      >
        <Text
          selectable={false}
          style={{
            color: isActive
              ? "rgba(255,255,255,0.96)"
              : isPast
                ? "rgba(255,255,255,0.48)"
                : "rgba(255,255,255,0.45)",
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
