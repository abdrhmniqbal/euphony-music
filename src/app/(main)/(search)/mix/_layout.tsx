import { useTranslation } from "react-i18next"
import { Stack } from "@/modules/shared/layouts/stack"
import { BackButton } from "@/modules/shared/components/patterns/back-button"
import { getMediaDetailTransitionOptions } from "@/modules/navigation/stack"
import { useThemeColors } from "@/modules/ui/theme"

export default function MixLayout() {
  const theme = useThemeColors()
  const { t } = useTranslation()

  return (
    <Stack
      screenOptions={getMediaDetailTransitionOptions(theme, () => (
        <BackButton className="-ml-2" />
      ))}
    >
      <Stack.Screen name="[id]" options={{ title: t("library.playlists") }} />
    </Stack>
  )
}
