import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import LocalSearchIcon from "@/components/icons/local/search";
import LocalSettingsIcon from "@/components/icons/local/settings";

export default function LibraryLayout() {
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
          title: "Library",
          headerLargeTitle: true,
          headerTitleAlign: "left",
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
        name="artist/[name]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="album/[name]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="playlist/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="playlist/create"
        options={{
          presentation: "modal",
          headerShown: true,
          title: "Create Playlist",
        }}
      />
    </Stack>
  );
}
