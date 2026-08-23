import { Stack } from "expo-router"

export default function ArtistLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
      <Stack.Screen name="[name]" />
    </Stack>
  )
}
