import { useRouter as useExpoRouter } from "expo-router"
import { ReactNode } from "react"
import { Platform, UIManager } from "react-native"
import Transition from "react-native-screen-transitions"

export function useGuardedRouter() {
  return useExpoRouter()
}

// --- Route Params ---
export function getSafeRouteName(val: string | string[] = "") {
  const raw = Array.isArray(val) ? val[0] ?? "" : val
  try {
    return { value: decodeURIComponent(raw), raw, decodeFailed: false }
  } catch {
    return { value: raw, raw, decodeFailed: true }
  }
}

// --- Stack Options ---
export const HIDDEN_STACK_SCREEN_OPTIONS = { headerShown: false } as const
export const ROOT_MODAL_SCREEN_OPTIONS = { headerShown: false, presentation: "modal", animation: "slide_from_bottom" } as const
const ROOT_TITLE_STYLE = { fontSize: 20, fontWeight: "600" as const }
const isMaskAvail = Platform.OS === "web" || !!UIManager.getViewManagerConfig?.("RNCMaskedView")

export function getHiddenBoundaryScreenOptions(p?: { transitionId?: string }) {
  const id = p?.transitionId
  if (!id || !isMaskAvail) {
    return { ...HIDDEN_STACK_SCREEN_OPTIONS, contentStyle: { backgroundColor: "transparent" }, ...Transition.Presets.ZoomIn(), gestureEnabled: false }
  }
  return {
    ...HIDDEN_STACK_SCREEN_OPTIONS,
    contentStyle: { backgroundColor: "transparent" },
    enableTransitions: true, navigationMaskEnabled: false, gestureEnabled: false,
    screenStyleInterpolator: ({ bounds }: any) => {
      "worklet"
      return bounds({ id, scaleMode: "uniform" }).navigation.zoom()
    }
  }
}

export const getHiddenArtistScreenOptions = getHiddenBoundaryScreenOptions
export const getHiddenPlayerScreenOptions = getHiddenBoundaryScreenOptions
export const getHiddenPlaylistScreenOptions = (p?: { transitionId?: string }) => p?.transitionId ? getHiddenBoundaryScreenOptions(p) : HIDDEN_STACK_SCREEN_OPTIONS

export const getDefaultNativeStackOptions = (theme: { background: string; foreground: string }) => ({
  headerShown: true, headerStyle: { backgroundColor: theme.background },
  headerTintColor: theme.foreground, headerShadowVisible: false,
  headerTitleAlign: "center" as const, headerTitleStyle: ROOT_TITLE_STYLE,
  freezeOnBlur: false, contentStyle: { backgroundColor: theme.background }
})

export const getMainRootScreenOptions = (o: { title: string; headerRight?: () => ReactNode; headerLeft?: () => ReactNode }) => ({ ...o, headerTitleAlign: "left" as const })
export const getCenteredRootScreenOptions = (o: { title: string; headerRight?: () => ReactNode; headerLeft?: () => ReactNode }) => ({ ...o, headerTitleAlign: "center" as const })

const backBtn = (title: string, headerLeft: () => ReactNode) => ({ title, headerBackButtonMenuEnabled: false, headerBackVisible: false, headerLeft, headerLeftContainerStyle: { paddingRight: 8 } })

export const getDrillDownScreenOptions = (title: string, headerLeft: () => ReactNode) => ({ ...backBtn(title, headerLeft), animation: "slide_from_right" as const })
export const getMediaDetailTransitionOptions = (theme: any, headerLeft: () => ReactNode) => ({ ...getDefaultNativeStackOptions(theme), ...backBtn("", headerLeft), animation: "fade_from_bottom" as const })
export const getModalTaskTransitionOptions = (theme: any, title: string, headerLeft: () => ReactNode) => ({ ...getDefaultNativeStackOptions(theme), ...backBtn(title, headerLeft), presentation: "modal" as const, animation: "slide_from_bottom" as const })

// --- Route Warning Runtime ---
import { logWarn } from "@/modules/logging/service"

interface RouteWarningOptions {
  key: string
  message: string
  metadata: Record<string, unknown>
  enabled: boolean
}

export function scheduleRouteWarning({ message, metadata, enabled }: RouteWarningOptions) {
  if (enabled) {
    logWarn(message, metadata)
  }
}
