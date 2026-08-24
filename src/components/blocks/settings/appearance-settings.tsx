import { useTranslation } from "react-i18next"

import { SettingsListGroup, SettingsNavigationRow, SettingsScrollView } from "@/components/blocks/settings/ui"
import { useGuardedRouter } from "@/core/navigation"
import { usePreferenceStore } from "@/core/preferences/store"
import { getAppThemeDefinition } from "@/core/theme/registry"
import { getLanguageOptions } from "@/domains/settings/language"

export function AppearanceSettings() {
  const router = useGuardedRouter()
  const { t } = useTranslation()
  const languageCode = usePreferenceStore((state) => state.language)
  const themeId = usePreferenceStore((state) => state.themeId)

  const languageOptions = getLanguageOptions()
  const currentOption = languageOptions.find((option) => option.code === languageCode)
  const languageLabel = currentOption ? t(currentOption.labelKey) : languageCode
  const themeDefinition = getAppThemeDefinition(themeId)
  const themeLabel = t(themeDefinition.labelKey)

  return (
    <SettingsScrollView>
      <SettingsListGroup>
        <SettingsNavigationRow
          title={t("settings.routes.theme.title")}
          description={t("settings.routes.theme.description", { theme: themeLabel })}
          onPress={() => router.push("/settings/theme")}
        />
        <SettingsNavigationRow
          title={t("settings.routes.themeMode.title")}
          description={t("settings.routes.themeMode.description")}
          onPress={() => router.push("/settings/theme-mode")}
        />
        <SettingsNavigationRow
          title={t("settings.routes.language.title")}
          description={t("settings.appearance.languageDescription", { language: languageLabel })}
          onPress={() => router.push("/settings/language")}
        />
      </SettingsListGroup>
    </SettingsScrollView>
  )
}
