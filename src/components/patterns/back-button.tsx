import type { ComponentProps } from "react"
import { type Href } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button } from "heroui-native"

import LocalArrowLeft02Icon from "@/components/icons/local/arrow-left-02"
import { useThemeColors } from "@/modules/ui/theme"

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
