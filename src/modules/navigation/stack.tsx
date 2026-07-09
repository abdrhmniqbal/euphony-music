/**
 * Purpose: Centralizes navigation stack screen options and shared route transition helpers, including player modal gesture boundaries.
 * Caller: Expo Router app layouts and nested detail route stacks.
 * Dependencies: expo-router stack options, react-native-screen-transitions, react-native-reanimated, react-native.
 * Main Functions: getDefaultNativeStackOptions(), getMainRootScreenOptions(), getCenteredRootScreenOptions(), getDrillDownScreenOptions(), getMediaDetailTransitionOptions(), getModalTaskTransitionOptions(), getHiddenBoundaryScreenOptions(), getHiddenArtistScreenOptions(), getHiddenPlaylistScreenOptions(), getHiddenPlayerScreenOptions()
 * Side Effects: None; builds navigation option objects only.
 */

import type { ReactNode } from "react"
import { Platform, UIManager } from "react-native"
import Transition from "react-native-screen-transitions"
import type { NativeStackNavigationOptions } from "react-native-screen-transitions/native-stack"

interface NavigationThemeColors {
  background: string
  foreground: string
}

type ScreenStyleInterpolatorArgs = Parameters<
  NonNullable<NativeStackNavigationOptions["screenStyleInterpolator"]>
>[0]

const isNavigationMaskAvailable =
  Platform.OS === "web" || Boolean(UIManager.getViewManagerConfig?.("RNCMaskedView"))

const ZOOM_TRANSITION_SPEC = {
  open: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: false,
    restSpeedThreshold: 0.002,
  },
  close: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: false,
    restSpeedThreshold: 0.002,
  },
}

const HIDDEN_STACK_SCREEN_OPTIONS = {
  headerShown: false,
} as const

type TransitionParams =
  | {
      transitionId?: string
    }
  | undefined

function getTransitionId(params: TransitionParams): string | undefined {
  const id = params?.transitionId
  return typeof id === "string" && id.length > 0 ? id : undefined
}

function getHiddenZoomTransitionOptions(boundaryId?: string): NativeStackNavigationOptions {
  if (!boundaryId || !isNavigationMaskAvailable) {
    return {
      ...HIDDEN_STACK_SCREEN_OPTIONS,
      contentStyle: { backgroundColor: "transparent" },
      ...Transition.Presets.ZoomIn(),
      gestureEnabled: false,
      transitionSpec: ZOOM_TRANSITION_SPEC,
    }
  }

  return {
    ...HIDDEN_STACK_SCREEN_OPTIONS,
    contentStyle: { backgroundColor: "transparent" },
    enableTransitions: true,
    navigationMaskEnabled: false,
    gestureEnabled: false,
    gestureDrivesProgress: false,
    screenStyleInterpolator: ({ bounds }: ScreenStyleInterpolatorArgs) => {
      "worklet"

      return bounds({
        id: boundaryId,
        scaleMode: "uniform",
      }).navigation.zoom()
    },
    transitionSpec: ZOOM_TRANSITION_SPEC,
  }
}

export function getHiddenBoundaryScreenOptions(params: TransitionParams) {
  return getHiddenZoomTransitionOptions(getTransitionId(params))
}

export function getHiddenArtistScreenOptions(params: TransitionParams) {
  return getHiddenBoundaryScreenOptions(params)
}

export function getHiddenPlaylistScreenOptions(params: TransitionParams) {
  const transitionId = getTransitionId(params)
  return transitionId
    ? getHiddenZoomTransitionOptions(transitionId)
    : HIDDEN_STACK_SCREEN_OPTIONS
}

export function getHiddenPlayerScreenOptions(params: TransitionParams) {
  return getHiddenBoundaryScreenOptions(params)
}

export const ROOT_MODAL_SCREEN_OPTIONS = {
  headerShown: false,
  presentation: "modal" as const,
  animation: "slide_from_bottom" as const,
}

const ROOT_TITLE_STYLE = {
  fontSize: 20,
  fontWeight: "600" as const,
}

function getBackButtonScreenOptions(title: string, headerLeft: () => ReactNode) {
  return {
    title,
    headerBackButtonMenuEnabled: false,
    headerBackVisible: false,
    headerLeft,
    headerLeftContainerStyle: {
      paddingRight: 8,
    },
  }
}

export function getDefaultNativeStackOptions(theme: NavigationThemeColors) {
  return {
    headerShown: true,
    headerStyle: {
      backgroundColor: theme.background,
    },
    headerTintColor: theme.foreground,
    headerShadowVisible: false,
    headerTitleAlign: "center" as const,
    headerTitleStyle: ROOT_TITLE_STYLE,
    freezeOnBlur: false,
    contentStyle: {
      backgroundColor: theme.background,
    },
  }
}

export function getMainRootScreenOptions(options: {
  title: string
  headerRight?: () => ReactNode
  headerLeft?: () => ReactNode
}) {
  return {
    title: options.title,
    headerTitleAlign: "left" as const,
    headerRight: options.headerRight,
    headerLeft: options.headerLeft,
  }
}

export function getCenteredRootScreenOptions(options: {
  title: string
  headerRight?: () => ReactNode
  headerLeft?: () => ReactNode
}) {
  return {
    title: options.title,
    headerTitleAlign: "center" as const,
    headerRight: options.headerRight,
    headerLeft: options.headerLeft,
  }
}

export function getDrillDownScreenOptions(title: string, headerLeft: () => ReactNode) {
  return {
    ...getBackButtonScreenOptions(title, headerLeft),
    animation: "slide_from_right",
  }
}

export function getMediaDetailTransitionOptions(
  theme: NavigationThemeColors,
  headerLeft: () => ReactNode
) {
  return {
    ...getDefaultNativeStackOptions(theme),
    ...getBackButtonScreenOptions("", headerLeft),
    animation: "fade_from_bottom",
  }
}

export function getModalTaskTransitionOptions(
  theme: NavigationThemeColors,
  title: string,
  headerLeft: () => ReactNode
) {
  return {
    ...getDefaultNativeStackOptions(theme),
    ...getBackButtonScreenOptions(title, headerLeft),
    presentation: "modal" as const,
    animation: "slide_from_bottom" as const,
  }
}
