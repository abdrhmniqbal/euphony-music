import { Stack } from "expo-router"
import { useThemeColor } from "heroui-native"

export default function OnboardingLayout() {
  const [background] = useThemeColor(["background"])

  return <Stack screenOptions={{ headerShown: false, gestureEnabled: false, contentStyle: { backgroundColor: background } }} />
}
