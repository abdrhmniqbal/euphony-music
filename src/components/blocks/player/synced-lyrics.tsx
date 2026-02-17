import * as React from "react"
import { useEffect, useRef } from "react"
import { useStore } from "@nanostores/react"
import { Dimensions, ScrollView, Text, View } from "react-native"

import { $currentTime, $currentTrack } from "@/modules/player/player.store"

const { height: SCREEN_HEIGHT } = Dimensions.get("window")

export function SyncedLyrics({ isVisible }: { isVisible: boolean }) {
  const currentTrack = useStore($currentTrack)
  const currentTime = useStore($currentTime)
  const scrollViewRef = useRef<ScrollView>(null)

  const lyrics = currentTrack?.lyrics || []

  // Find active line index
  const activeLineIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1]
    return (
      currentTime >= line.time && (!nextLine || currentTime < nextLine.time)
    )
  })

  useEffect(() => {
    if (activeLineIndex !== -1 && isVisible) {
      scrollViewRef.current?.scrollTo({
        y: activeLineIndex * 60 - SCREEN_HEIGHT / 4,
        animated: true,
      })
    }
  }, [activeLineIndex, isVisible])

  if (!isVisible) return null

  return (
    <View className="my-4 flex-1 px-4">
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: SCREEN_HEIGHT / 3 }}
      >
        {lyrics.length === 0 ? (
          <Text className="text-center text-lg text-white/40 italic">
            No lyrics available for this track
          </Text>
        ) : (
          lyrics.map((line, index) => (
            <View
              key={`${line.time}-${line.text}`}
              style={{ height: 60 }}
              className="items-center justify-center"
            >
              <Text
                className={`px-4 text-center text-2xl font-bold transition-all duration-300 ${
                  index === activeLineIndex
                    ? "scale-110 text-white opacity-100"
                    : "scale-100 text-white/30 opacity-50"
                }`}
              >
                {line.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}
