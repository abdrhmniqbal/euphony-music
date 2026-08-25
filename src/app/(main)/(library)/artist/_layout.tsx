import { Stack } from "expo-router"
import { useThemeColor } from "heroui-native"

export default function ArtistLayout() {
  const [background] = useThemeColor(["background"])

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade_from_bottom",
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="[name]" />
    </Stack>
  )
}
