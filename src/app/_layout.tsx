import "../global.css"
import "../core/localization/i18n"

import { QueryClientProvider } from "@tanstack/react-query"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { HeroUINativeProvider } from "heroui-native"

import { StartupEffects } from "@/core/bootstrap/startup-effects"
import { DatabaseGate } from "@/core/db/runtime"
import { getHiddenPlayerScreenOptions, TransitionStack } from "@/core/navigation"
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
            <TransitionStack screenOptions={{ headerShown: false }}>
              <TransitionStack.Screen name="index" />
              {/* (main) hosts the mini player boundary, which requires the descriptors provider mounted by TransitionStack */}
              <TransitionStack.Screen name="(main)" />
              <TransitionStack.Screen
                name="player"
                options={({ route }) => getHiddenPlayerScreenOptions(route)}
              />
            </TransitionStack>
            <StartupEffects />
            <AppUpdateSheet />
            <AppToastRuntime />
          </DatabaseGate>
        </HeroUINativeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
