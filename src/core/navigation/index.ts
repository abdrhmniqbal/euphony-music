import { useRouter as useExpoRouter } from "expo-router"
import { useMemo } from "react"
import { Platform, UIManager } from "react-native"
import Transition from "react-native-screen-transitions"
import type { ScreenStyleInterpolator } from "react-native-screen-transitions"
import type { NativeStackNavigationOptions } from "react-native-screen-transitions/native-stack"

export { TransitionStack } from "./transition-stack"

let guardExpires = 0
let guardKey = ""

// Guards against duplicate navigation calls fired in quick succession
// (e.g. press handlers racing with notification taps).
export function useGuardedRouter() {
  const router = useExpoRouter()
  return useMemo(() => {
    const make =
      (method: "push" | "replace") =>
      (href: Parameters<typeof router.push>[0], ...args: unknown[]) => {
        const key = method + JSON.stringify(href)
        const now = Date.now()
        if (guardKey === key && guardExpires > now) return
        guardKey = key
        guardExpires = now + 900
        // SAFETY: method is constrained to "push" | "replace", whose router signatures accept (href, ...args)
        const callRouterMethod = router[method] as (...a: unknown[]) => void
        callRouterMethod(href, ...args)
      }
    return { ...router, push: make("push"), replace: make("replace") }
  }, [router])
}

export const HIDDEN_STACK_SCREEN_OPTIONS = { headerShown: false } as const

const isMaskAvail = Platform.OS === "web" || !!UIManager.getViewManagerConfig?.("RNCMaskedView")

interface TransitionRouteParams {
  transitionId?: string
}

function createZoomInterpolator(id: string): ScreenStyleInterpolator {
  return ({ bounds }) => {
    "worklet"
    // zoom() already applies the uniform scale mode + top anchor shared options
    return bounds(id).navigation.zoom()
  }
}

export function getHiddenBoundaryScreenOptions(
  p?: TransitionRouteParams
): NativeStackNavigationOptions {
  const id = p?.transitionId
  if (!id || !isMaskAvail) {
    return {
      ...HIDDEN_STACK_SCREEN_OPTIONS,
      contentStyle: { backgroundColor: "transparent" },
      ...Transition.Presets.ZoomIn(),
      gestureEnabled: false,
    }
  }
  return {
    ...HIDDEN_STACK_SCREEN_OPTIONS,
    contentStyle: { backgroundColor: "transparent" },
    enableTransitions: true,
    navigationMaskEnabled: false,
    gestureEnabled: false,
    screenStyleInterpolator: createZoomInterpolator(id),
  }
}

export function getHiddenPlayerScreenOptions(route?: { params?: TransitionRouteParams }) {
  return getHiddenBoundaryScreenOptions(route?.params)
}
