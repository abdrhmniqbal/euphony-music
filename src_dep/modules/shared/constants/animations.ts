import { FadeIn, FadeOut } from "react-native-reanimated"

const SCREEN_TRANSITION_ENTER_MS = 220
const SCREEN_TRANSITION_EXIT_MS = 160

export function screenEnterTransition() {
  return FadeIn.duration(SCREEN_TRANSITION_ENTER_MS)
}

export function screenExitTransition() {
  return FadeOut.duration(SCREEN_TRANSITION_EXIT_MS)
}
