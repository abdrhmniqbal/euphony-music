/**
 * Purpose: Provides a single themed pull-to-refresh control for app scroll screens.
 * Caller: Home and library route screens that render RefreshControl.
 * Dependencies: react-native RefreshControl, app theme colors.
 * Main Functions: ThemedRefreshControl()
 * Side Effects: None.
 */

import { RefreshControl, type RefreshControlProps } from "react-native"

import { useThemeColors } from "@/modules/ui/theme"

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
