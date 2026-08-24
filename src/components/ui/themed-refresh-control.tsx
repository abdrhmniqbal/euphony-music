import { useThemeColor } from "heroui-native"
import { RefreshControl, type RefreshControlProps } from "react-native"

type ThemedRefreshControlProps = Omit<
  RefreshControlProps,
  "colors" | "tintColor" | "progressBackgroundColor"
>

export function ThemedRefreshControl(props: ThemedRefreshControlProps) {
  const [accent, defaultColor] = useThemeColor(["accent", "default"])

  return (
    <RefreshControl
      {...props}
      colors={[accent]}
      tintColor={accent}
      progressBackgroundColor={defaultColor}
    />
  )
}
