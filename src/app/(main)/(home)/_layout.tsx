import { Stack } from "expo-router"
import { useThemeColor } from "heroui-native"

export default function HomeLayout() {
  const [background] = useThemeColor(["background"])

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="recently-played" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="top-tracks" options={{ animation: "fade_from_bottom" }} />
    </Stack>
  )
}
