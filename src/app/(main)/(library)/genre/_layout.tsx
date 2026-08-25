import { Stack } from "expo-router"

export default function GenreLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, animation: "fade_from_bottom" }}>
      <Stack.Screen name="[name]" />
    </Stack>
  )
}
