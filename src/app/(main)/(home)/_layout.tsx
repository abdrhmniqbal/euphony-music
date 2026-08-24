import { Stack } from "expo-router"

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="recently-played" options={{ animation: "fade_from_bottom" }} />
      <Stack.Screen name="top-tracks" options={{ animation: "fade_from_bottom" }} />
    </Stack>
  )
}
