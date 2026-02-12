import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Button } from "heroui-native";
import LocalSearchIcon from "@/components/icons/local/search";
import LocalSettingsIcon from "@/components/icons/local/settings";
import { BackButton } from "@/components/patterns";

export default function HomeLayout() {
  const theme = useThemeColors();
  const router = useRouter();

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
          title: "EMP",
          headerLargeTitle: true,
          headerTitleAlign: "left",
          headerTitleStyle: {
            fontSize: 28,
          },
          headerRight: () => (
            <View className="flex-row gap-4 -mr-2">
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
        name="recently-played"
        options={{
          title: "Recently Played",
          headerBackButtonMenuEnabled: false,
          headerBackVisible: false,
          headerLeft: () => <BackButton className="-ml-2" />,
        }}
      />
      <Stack.Screen name="top-tracks" options={{ title: "Top Tracks" }} />
    </Stack>
  );
}
