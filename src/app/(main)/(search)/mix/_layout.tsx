import { Stack } from "expo-router"

export default function MixLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ animation: "fade_from_bottom" }} />
    </Stack>
  )
}
