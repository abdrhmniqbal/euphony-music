/**
 * Purpose: Shared stack layout for search detail routes (album, artist, playlist).
 * Provides deterministic back navigation that falls back to search root.
 * Used by album/, artist/, and playlist/ _layout.tsx to avoid triplication.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation"
import { PressableFeedback } from "heroui-native"

import LocalArrowLeft02Icon from "@/modules/shared/components/icons/local/arrow-left-02"
import { Stack } from "@/modules/shared/layouts/stack"
import { getMediaDetailTransitionOptions } from "@/modules/navigation"
import { useThemeColors } from "@/modules/ui/theme"

export default function SearchDetailLayout() {
  const theme = useThemeColors()
  const router = useRouter()

  function handleBackPress() {
    if (router.canGoBack?.()) {
      router.back()
      return
    }

    router.replace("/(main)/(search)")
  }

  return (
    <Stack
      screenOptions={getMediaDetailTransitionOptions(theme, () => (
        <PressableFeedback onPress={handleBackPress} className="-ml-2 p-2">
          <LocalArrowLeft02Icon fill="none" width={24} height={24} color={theme.foreground} />
        </PressableFeedback>
      ))}
    />
  )
}
