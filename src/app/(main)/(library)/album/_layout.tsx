import { BackButton } from "@/components/patterns/back-button"
import { Stack } from "@/layouts/stack"
import { getMediaDetailTransitionOptions } from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function AlbumLayout() {
  const theme = useThemeColors()

  return (
    <Stack
      screenOptions={getMediaDetailTransitionOptions(theme, () => (
        <BackButton className="-ml-2" />
      ))}
    />
  )
}
