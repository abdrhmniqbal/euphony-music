import { Stack } from "expo-router"
import { useThemeColor } from "heroui-native"

export default function SearchLayout() {
  const [background] = useThemeColor(["background"])

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="search" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="recently-added" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="album" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="artist" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="playlist" options={{ animation: "fade_from_bottom" }} />
    </Stack>
  )
}
