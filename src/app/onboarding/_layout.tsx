/**
 * Purpose: Layout for the onboarding flow.
 * Caller: Root layout conditionally.
 * Dependencies: Expo Router Stack.
 */

import { Stack } from "expo-router"

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="restore" />
    </Stack>
  )
}
