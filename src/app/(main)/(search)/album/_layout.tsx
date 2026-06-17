/**
 * Purpose: Defines search album detail stack options with deterministic back navigation.
 * Caller: Search stack nested album routes.
 * Dependencies: Stack, media-detail screen options, theme colors.
 * Main Functions: SearchAlbumLayout()
 * Side Effects: None beyond rendering navigation state.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { PressableFeedback } from "heroui-native"

import LocalArrowLeftIcon from "@/components/icons/local/arrow-left"
import { Stack } from "@/layouts/stack"
import { getMediaDetailTransitionOptions } from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function SearchAlbumLayout() {
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
          <LocalArrowLeftIcon fill="none" width={24} height={24} color={theme.foreground} />
        </PressableFeedback>
      ))}
    />
  )
}
