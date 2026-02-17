import { Stack, useRouter } from "expo-router"
import { Button } from "heroui-native"
import { View } from "react-native"

import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalSearchIcon from "@/components/icons/local/search"
import LocalSettingsIcon from "@/components/icons/local/settings"
import { BackButton } from "@/components/patterns"

export default function LibraryLayout() {
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
          title: "Library",
          headerLargeTitle: true,
          headerTitleAlign: "left",
          headerRight: () => (
            <View className="-mr-2 flex-row gap-4">
              <Button
                onPress={() => router.push("/search-interaction")}
                variant="ghost"
                isIconOnly
              >
                <LocalSearchIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.foreground}
                />
              </Button>
              <Button
                onPress={() => router.push("/settings")}
                variant="ghost"
                isIconOnly
              >
                <LocalSettingsIcon
                  fill="none"
                  width={24}
                  height={24}
                  color={theme.foreground}
                />
              </Button>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="artist/[name]"
        options={{
          headerTitleAlign: "center",
          headerBackButtonMenuEnabled: false,
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" />,
        }}
      />
      <Stack.Screen
        name="album/[name]"
        options={{
          headerTitleAlign: "center",
          headerBackButtonMenuEnabled: false,
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" />,
        }}
      />
      <Stack.Screen
        name="playlist/[id]"
        options={{
          title: "Playlist",
          headerTitleAlign: "center",
          headerBackButtonMenuEnabled: false,
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" />,
        }}
      />
      <Stack.Screen
        name="playlist/form"
        options={{
          title: "Playlist",
          headerTitleAlign: "center",
          headerBackButtonMenuEnabled: false,
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" />,
        }}
      />
    </Stack>
  )
}
