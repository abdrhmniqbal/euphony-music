import { Stack, useRouter } from "expo-router"
import { PressableFeedback } from "heroui-native"

import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalCancelIcon from "@/components/icons/local/cancel"
import { BackButton } from "@/components/patterns"

export default function SettingsLayout() {
  const theme = useThemeColors()
  const router = useRouter()

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.foreground,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: theme.background },
        animation: "default",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          headerLargeTitle: true,
          headerLeft: () => (
            <PressableFeedback onPress={() => router.back()} hitSlop={20}>
              <LocalCancelIcon
                fill="none"
                width={24}
                height={24}
                color={theme.foreground}
              />
            </PressableFeedback>
          ),
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          title: "Appearance",
          headerBackButtonMenuEnabled: false,
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" />,
        }}
      />
    </Stack>
  )
}
