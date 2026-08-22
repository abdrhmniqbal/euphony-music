import { BackButton } from "@/modules/shared/components/patterns/back-button"
import { useTranslation } from "react-i18next"
import { Stack } from "@/modules/shared/layouts/stack"
import {
  getMediaDetailTransitionOptions,
  getModalTaskTransitionOptions,
} from "@/modules/navigation"
import { useThemeColors } from "@/modules/ui/theme"

export default function PlaylistLayout() {
  const theme = useThemeColors()
  const { t } = useTranslation()

  return (
    <Stack
      screenOptions={getMediaDetailTransitionOptions(theme, () => (
        <BackButton className="-ml-2" />
      ))}
    >
      <Stack.Screen name="[id]" options={{ title: t("playlist.playlist") }} />
      <Stack.Screen
        name="form"
        options={getModalTaskTransitionOptions(theme, t("playlist.playlist"), () => (
          <BackButton className="-ml-2" />
        ))}
      />
    </Stack>
  )
}
