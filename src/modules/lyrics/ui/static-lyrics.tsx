import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import type { LyricsLine } from "@/modules/lyrics/plain-text"

export const StaticLyrics: React.FC<{
  lines: LyricsLine[]
  fontScale: number
}> = ({ lines, fontScale }) => {
  return lines.map((line) => {
    if (line.isSpacer) {
      return <View key={line.id} style={{ height: 14 }} />
    }

    return (
      <PressableFeedback key={line.id} className="py-1 active:opacity-85">
        <Text
          selectable={false}
          style={{
            color: "rgba(255,255,255,0.8)",
            fontSize: 20 * fontScale,
            lineHeight: 32 * fontScale,
            fontWeight: "700",
            letterSpacing: 0,
          }}
        >
          {line.text}
        </Text>
      </PressableFeedback>
    )
  })
}
