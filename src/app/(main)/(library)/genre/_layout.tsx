import { Stack } from "expo-router"
import { useThemeColor } from "heroui-native"

export default function GenreLayout() {
  const [background, foreground] = useThemeColor(["background", "foreground"])

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "fade_from_bottom",
        headerStyle: { backgroundColor: background },
        headerTitleStyle: { color: foreground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="[name]" />
    </Stack>
  )
}
