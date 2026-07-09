import { BackButton } from "@/modules/shared/components/patterns/back-button"
import { Stack } from "@/modules/shared/layouts/stack"
import { getMediaDetailTransitionOptions } from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function ArtistLayout() {
  const theme = useThemeColors()

  return (
    <Stack
      screenOptions={getMediaDetailTransitionOptions(theme, () => (
        <BackButton className="-ml-2" />
      ))}
    />
  )
}
