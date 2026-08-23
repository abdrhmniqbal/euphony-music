import { Stack } from "expo-router"

export default function GenreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
      <Stack.Screen name="[name]" />
    </Stack>
  )
}
