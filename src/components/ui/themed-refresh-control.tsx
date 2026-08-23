import { RefreshControl, type RefreshControlProps } from "react-native"

import { useThemeColors } from "@/core/theme/use-theme-colors"

type ThemedRefreshControlProps = Omit<
  RefreshControlProps,
  "colors" | "tintColor" | "progressBackgroundColor"
>

export function ThemedRefreshControl(props: ThemedRefreshControlProps) {
  const theme = useThemeColors()

  return (
    <RefreshControl
      {...props}
      colors={[theme.accent]}
      tintColor={theme.accent}
      progressBackgroundColor={theme.default}
    />
  )
}
