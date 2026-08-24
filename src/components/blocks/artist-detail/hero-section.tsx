import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import type { AnimatedStyle } from "react-native-reanimated"
import Animated from "react-native-reanimated"
import { Text, View, type StyleProp, type ViewStyle } from "react-native"

import LocalUserSolidIcon from "@/components/icons/local/user-solid"

interface ArtistHeroSectionProps {
  screenWidth: number
  heroArtworkStyle: StyleProp<AnimatedStyle<ViewStyle>>
  artistImage?: string
  mutedColor: string
  backgroundColor: string
  foregroundColor: string
  artistName: string
  trackCountLabel: string
}

export function ArtistHeroSection({
  screenWidth,
  heroArtworkStyle,
  artistImage,
  mutedColor,
  backgroundColor,
  foregroundColor,
  artistName,
  trackCountLabel,
}: ArtistHeroSectionProps) {
  return (
    <View style={{ height: screenWidth }} className="relative overflow-hidden">
      <Animated.View
        style={[{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, heroArtworkStyle]}
      >
        {artistImage ? (
          <Image
            source={{ uri: artistImage }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-surface-secondary">
            <LocalUserSolidIcon fill="none" width={120} height={120} color={mutedColor} />
          </View>
        )}
      </Animated.View>

      <LinearGradient
        colors={["transparent", `${backgroundColor}B3`, backgroundColor]}
        locations={[0.3, 0.7, 1]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" }}
      />

      <View className="absolute right-6 bottom-8 left-6">
        <Text style={{ color: foregroundColor }} className="mb-2 text-4xl font-bold">
          {artistName}
        </Text>
        <Text style={{ color: foregroundColor, opacity: 0.72 }} className="text-base">
          {trackCountLabel}
        </Text>
      </View>
    </View>
  )
}
