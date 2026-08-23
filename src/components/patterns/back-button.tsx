import { Button } from "heroui-native"
import type { ComponentProps } from "react"
import { useRouter } from "expo-router"
import type { Href } from "expo-router"

import LocalArrowLeft02Icon from "@/components/icons/local/arrow-left-02"
import { useThemeColors } from "@/core/theme/use-theme-colors"

interface BackButtonProps {
  onPress?: () => void
  variant?: ComponentProps<typeof Button>["variant"]
  className?: string
  fallbackHref?: Href
  iconColor?: string
}

export function BackButton({
  onPress,
  variant = "ghost",
  className,
  fallbackHref = "/",
  iconColor,
}: BackButtonProps) {
  const theme = useThemeColors()
  const router = useRouter()

  function handlePress() {
    if (onPress) {
      onPress()
      return
    }

    if (router.canGoBack?.()) {
      router.back()
      return
    }

    router.replace(fallbackHref)
  }

  return (
    <Button onPress={handlePress} variant={variant} className={className} isIconOnly>
      <LocalArrowLeft02Icon
        fill="none"
        width={24}
        height={24}
        color={iconColor ?? theme.foreground}
      />
    </Button>
  )
}
