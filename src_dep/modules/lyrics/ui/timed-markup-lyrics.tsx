import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { type LayoutChangeEvent, Text, View } from "react-native"
import Animated, { useAnimatedStyle, useDerivedValue } from "react-native-reanimated"
import type { TimedLine } from "@/modules/lyrics"
import {
  getTimedDisplayText,
  getTimedLineText,
  getTimedWordGroups,
  hasWordLevelTiming,
} from "@/modules/lyrics"

interface ReadableSharedValue<T> {
  readonly value: T
}

const TimedMarkupWordSpan: React.FC<{
  text: string
  begin: number
  end: number
  currentTimeSv: ReadableSharedValue<number>
  lineActive: boolean
  linePast: boolean
  fontScale: number
}> = ({ text, begin, end, currentTimeSv, lineActive, linePast, fontScale }) => {
  const [textWidth, setTextWidth] = React.useState(0)

  const baseColor = lineActive
    ? "rgba(255,255,255,0.46)"
    : linePast
      ? "rgba(255,255,255,0.54)"
      : "rgba(255,255,255,0.45)"

  const activeColor = "rgba(255,255,255,0.96)"
  const fontSize = (lineActive ? 24 : 18) * fontScale
  const lineHeight = (lineActive ? 36 : 28) * fontScale
  const fontWeight = lineActive ? "700" : "600"

  const displayText = getTimedDisplayText(text)
  const wordProgressSv = useDerivedValue(() => {
    const wordDuration = Math.max(end - begin, 0.001)
    const currentTime = currentTimeSv.value
    return linePast
      ? 1
      : lineActive
        ? Math.max(0, Math.min(1, (currentTime - begin) / wordDuration))
        : 0
  }, [begin, end, lineActive, linePast])

  const foregroundClipStyle = useAnimatedStyle(() => {
    return {
      width: textWidth * wordProgressSv.value,
    }
  }, [textWidth])

  return (
    <View style={{ position: "relative", justifyContent: "center" }}>
      <Text
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        style={{
          color: baseColor,
          fontSize,
          lineHeight,
          fontWeight,
          letterSpacing: 0,
          paddingHorizontal: 0,
          marginHorizontal: 0,
        }}
      >
        {displayText}
      </Text>
      {textWidth > 0 && (
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 0,
              overflow: "hidden",
            },
            foregroundClipStyle,
          ]}
        >
          <Animated.View
            style={{
              width: textWidth,
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
            }}
          >
            <Animated.Text
              style={{
                color: activeColor,
                fontSize,
                lineHeight,
                fontWeight,
                letterSpacing: 0,
                paddingHorizontal: 0,
                marginHorizontal: 0,
                width: textWidth,
              }}
            >
              {displayText}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}

const TimedMarkupLineRow: React.FC<{
  line: TimedLine
  isActive: boolean
  isPast: boolean
  fontScale: number
  onSeek: (time: number, text?: string) => void
  onLayoutLine: (id: string, y: number) => void
  currentTimeSv: ReadableSharedValue<number>
}> = ({ line, isActive, isPast, fontScale, onSeek, onLayoutLine, currentTimeSv }) => {
  const lineText = React.useMemo(() => getTimedLineText(line).trim(), [line])
  const handlePress = React.useCallback(
    () => onSeek(line.begin, lineText),
    [line.begin, lineText, onSeek]
  )
  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => onLayoutLine(line.id, event.nativeEvent.layout.y),
    [line.id, onLayoutLine]
  )
  const wordGroups = React.useMemo(() => getTimedWordGroups(line), [line])
  const canRenderWordProgress = isActive && hasWordLevelTiming(line)
  const textColor = isActive
    ? "rgba(255,255,255,0.96)"
    : isPast
      ? "rgba(255,255,255,0.54)"
      : "rgba(255,255,255,0.45)"
  const fontSize = (isActive ? 24 : 18) * fontScale
  const lineHeight = (isActive ? 36 : 28) * fontScale
  const fontWeight = isActive ? "700" : "600"

  return (
    <PressableFeedback
      onPress={handlePress}
      className="active:opacity-85"
      style={{ paddingVertical: isActive ? 14 : 8 }}
      onLayout={handleLayout}
    >
      {canRenderWordProgress ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            columnGap: Math.max(4, 6 * fontScale),
          }}
        >
          {wordGroups.map((group) => (
            <View
              key={`${line.id}-${group[0]?.begin ?? 0}-${group.map((word) => word.text).join("")}`}
              style={{ flexDirection: "row" }}
            >
              {group.map((word) => (
                <TimedMarkupWordSpan
                  key={`${line.id}-${word.begin}-${word.end}-${word.text}`}
                  text={word.text}
                  begin={word.begin}
                  end={word.end}
                  currentTimeSv={currentTimeSv}
                  lineActive={isActive}
                  linePast={isPast}
                  fontScale={fontScale}
                />
              ))}
            </View>
          ))}
        </View>
      ) : (
        <Text
          selectable={false}
          style={{
            color: textColor,
            fontSize,
            lineHeight,
            fontWeight,
            letterSpacing: 0,
          }}
        >
          {lineText}
        </Text>
      )}
    </PressableFeedback>
  )
}

export const TimedMarkupLyrics: React.FC<{
  lines: TimedLine[]
  activeIndex: number
  fontScale: number
  onSeek: (time: number, text?: string) => void
  onLayoutLine: (id: string, y: number) => void
  currentTimeSv: ReadableSharedValue<number>
}> = ({ lines, activeIndex, fontScale, onSeek, onLayoutLine, currentTimeSv }) => {
  return lines.map((line, index) => {
    const isActive = index === activeIndex
    const isPast = activeIndex >= 0 && index < activeIndex

    return (
      <TimedMarkupLineRow
        key={line.id}
        line={line}
        isActive={isActive}
        isPast={isPast}
        fontScale={fontScale}
        onSeek={onSeek}
        onLayoutLine={onLayoutLine}
        currentTimeSv={currentTimeSv}
      />
    )
  })
}
