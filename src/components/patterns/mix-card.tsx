import type { ReactNode } from "react"
import { Card, PressableFeedback } from "heroui-native"
import { Text, View } from "react-native"

import { PlaylistArtwork } from "@/components/patterns/playlist-artwork"

const PATTERN_ELEMENTS: Record<string, ReactNode> = {
  circles: (
    <>
      <View className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
      <View className="absolute right-4 bottom-[-10] h-16 w-16 rounded-full bg-white/8" />
    </>
  ),
  waves: (
    <>
      <View className="absolute bottom-[-20] -left-12 h-40 w-40 rounded-full border-20 border-white/10" />
      <View className="absolute top-[-20] right-[-20] h-28 w-28 rounded-full border-12 border-white/10" />
    </>
  ),
  grid: (
    <View className="absolute inset-0 flex-row flex-wrap gap-2 p-1.5">
      {Array.from({ length: 12 }).map((_, index) => (
        <View key={index} className="h-6 w-6 rounded-sm bg-white/5" />
      ))}
    </View>
  ),
  diamonds: (
    <>
      <View className="absolute top-4 right-[-10] h-16 w-16 rotate-45 bg-white/10" />
      <View className="absolute bottom-0 left-[-20] h-24 w-24 rotate-45 bg-white/5" />
    </>
  ),
  triangles: (
    <>
      <View className="absolute top-0 right-0 h-0 w-0 border-t-40 border-l-40 border-t-white/10 border-l-transparent" />
      <View className="absolute bottom-[-10] left-4 h-0 w-0 border-r-60 border-b-60 border-r-transparent border-b-white/8" />
    </>
  ),
  rings: (
    <>
      <View className="absolute -top-2 -right-2 h-16 w-16 rounded-full border-4 border-white/15" />
      <View className="absolute -top-6 -right-6 h-24 w-24 rounded-full border-4 border-white/8" />
    </>
  ),
  pills: (
    <>
      <View className="absolute top-2 right-0 h-8 w-20 rotate-[-15deg] rounded-full bg-white/10" />
      <View className="absolute bottom-4 -left-4 h-10 w-24 rotate-25 rounded-full bg-white/8" />
    </>
  ),
  stripes: (
    <>
      <View className="absolute top-0 -left-6 h-28 w-3 rotate-12 bg-white/8" />
      <View className="absolute top-0 left-6 h-28 w-3 rotate-12 bg-white/10" />
      <View className="absolute top-0 left-18 h-28 w-3 rotate-12 bg-white/8" />
      <View className="absolute top-0 left-30 h-28 w-3 rotate-12 bg-white/10" />
    </>
  ),
  stars: (
    <>
      <View className="absolute top-4 right-6 h-12 w-3 rounded-full bg-white/10" />
      <View className="absolute top-8 right-1.5 h-3 w-12 rounded-full bg-white/10" />
      <View className="absolute bottom-3 left-7 h-8 w-2 rounded-full bg-white/8" />
      <View className="absolute bottom-6 left-4 h-2 w-8 rounded-full bg-white/8" />
    </>
  ),
  zigzag: (
    <>
      <View className="absolute top-6 right-[-8] h-2 w-14 rotate-45 bg-white/10" />
      <View className="absolute top-12 right-2 h-2 w-14 -rotate-45 bg-white/8" />
      <View className="absolute top-18 right-[-8] h-2 w-14 rotate-45 bg-white/8" />
      <View className="absolute bottom-6 left-[-8] h-2 w-12 -rotate-45 bg-white/8" />
    </>
  ),
  crosses: (
    <>
      <View className="absolute top-4 right-5 h-10 w-2 rounded-full bg-white/10" />
      <View className="absolute top-8 right-1 h-2 w-10 rounded-full bg-white/10" />
      <View className="absolute bottom-4 left-5 h-8 w-2 rounded-full bg-white/8" />
      <View className="absolute bottom-7 left-2 h-2 w-8 rounded-full bg-white/8" />
    </>
  ),
}

export interface MixCardProps {
  title: string
  images: string[]
  color: string
  pattern: string
  onPress: () => void
  onLongPress?: () => void
}

export function MixCard({ title, images, color, pattern, onPress, onLongPress }: MixCardProps) {
  return (
    <PressableFeedback onPress={onPress} onLongPress={onLongPress} className="flex-1">
      <Card className="relative aspect-square overflow-hidden rounded-[28px] border-none p-0">
        <View className="absolute inset-0">
          <PlaylistArtwork images={images} />
        </View>
        <View
          className="absolute bottom-0 inset-x-0 overflow-hidden px-5 py-4"
          style={{ backgroundColor: color }}
        >
          <View pointerEvents="none" className="absolute inset-0">
            {PATTERN_ELEMENTS[pattern]}
          </View>
          <Text className="text-[17px] font-black leading-tight text-white" numberOfLines={1}>
            {title}
          </Text>
        </View>
      </Card>
    </PressableFeedback>
  )
}
