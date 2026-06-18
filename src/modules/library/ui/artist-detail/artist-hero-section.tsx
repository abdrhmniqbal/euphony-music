import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import Transition from "react-native-screen-transitions"
import Animated from "react-native-reanimated"
import { Text, View } from "react-native"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"

interface ArtistHeroSectionProps {
  screenWidth: number
  artistTransitionId: string
  heroArtworkStyle: object
  artistImage?: string
  mutedColor: string
  backgroundColor: string
  artistName: string
  trackCountLabel: string
}

export function ArtistHeroSection({
  screenWidth,
  artistTransitionId,
  heroArtworkStyle,
  artistImage,
  mutedColor,
  backgroundColor,
  artistName,
  trackCountLabel,
}: ArtistHeroSectionProps) {
  return (
    <View style={{ height: screenWidth }} className="relative overflow-hidden">
      <Transition.Boundary.View
        id={artistTransitionId}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      >
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
      </Transition.Boundary.View>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", backgroundColor]}
        locations={[0.3, 0.7, 1]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "60%",
        }}
      />

      <View className="absolute right-6 bottom-8 left-6">
        <Text className="mb-2 text-4xl font-bold text-white">{artistName}</Text>
        <Text className="text-base text-white/70">{trackCountLabel}</Text>
      </View>
    </View>
  )
}
