import { Stack } from "expo-router"

export default function SearchLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="search" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="recently-added" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="album" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="artist" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="playlist" options={{ animation: "fade_from_bottom" }} />
    </Stack>
  )
}
