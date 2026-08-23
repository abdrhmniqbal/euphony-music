import { Stack } from "expo-router"

export default function PlaylistLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, animation: "fade_from_bottom" }}>
      <Stack.Screen name="form" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
