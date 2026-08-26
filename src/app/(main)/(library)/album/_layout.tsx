import { Stack } from "expo-router"
import { useThemeColor } from "heroui-native"

export default function AlbumLayout() {
  const [background, foreground] = useThemeColor(["background", "foreground"])

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "fade_from_bottom",
        headerStyle: { backgroundColor: background },
        headerTintColor: foreground,
        headerTitleStyle: { color: foreground },
        headerTitleAlign: "center",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: background },
      }}
    >
      <Stack.Screen name="[name]" />
    </Stack>
  )
}
