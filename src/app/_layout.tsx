import "../global.css";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { Stack } from "expo-router";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useUniwind } from "uniwind";
import { useAppBootstrap } from "@/modules/bootstrap/hooks/use-app-bootstrap";

import { FullPlayer } from "@/components/blocks/full-player";
import { IndexingProgress } from "@/components/blocks/indexing-progress";
import { Providers } from "@/components/providers";

export default function Layout() {
  const { theme: currentTheme } = useUniwind();
  const theme = useThemeColors();
  useAppBootstrap();

  const navigationTheme = {
    ...(currentTheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(currentTheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.background,
      text: theme.foreground,
      border: theme.divider,
      notification: theme.accent,
    },
  };

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ThemeProvider value={navigationTheme}>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <HeroUINativeProvider
            config={{
              devInfo: { stylingPrinciples: false },
              toast: {
                defaultProps: {
                  placement: "bottom",
                },
              },
            }}
          >
            <Providers>
              <View className="flex-1">
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.background },
                  }}
                >
                  <Stack.Screen name="(main)" />
                  <Stack.Screen
                    name="search-interaction"
                    options={{
                      animation: "fade",
                      title: "Search",
                    }}
                  />
                  <Stack.Screen
                    name="settings"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                    }}
                  />
                </Stack>
                <IndexingProgress />
                <FullPlayer />
              </View>
            </Providers>
          </HeroUINativeProvider>
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
