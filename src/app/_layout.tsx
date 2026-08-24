import "../global.css"
import "../core/localization/i18n"

import { QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { HeroUINativeProvider } from "heroui-native"

import { StartupEffects } from "@/core/bootstrap/startup-effects"
import { DatabaseGate } from "@/core/db/runtime"
import { getHiddenPlayerScreenOptions } from "@/core/navigation"
import { queryClient } from "@/core/query/query-client"
import { ThemeRuntime } from "@/core/theme/theme-runtime"
import { AppToastRuntime } from "@/core/ui/app-toast-runtime"
import { AppUpdateSheet } from "@/domains/updates/ui/app-update-sheet"

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
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
          <ThemeRuntime />
          <DatabaseGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen
                name="(main)"
                // SAFETY: enableTransitions is a react-native-screen-transitions option read through the stack adapter; the (main) subtree hosts boundary components (mini player) that require its descriptors provider
                options={{ enableTransitions: true } as never}
              />
              <Stack.Screen
                name="player"
                // SAFETY: options come from our own boundary helper and are accepted by expo-router at runtime despite looser static types
                options={({ route }) => getHiddenPlayerScreenOptions(route) as never}
              />
            </Stack>
            <StartupEffects />
            <AppUpdateSheet />
            <AppToastRuntime />
          </DatabaseGate>
        </HeroUINativeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
