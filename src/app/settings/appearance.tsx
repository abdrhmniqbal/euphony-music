/**
 * Purpose: Renders appearance preferences for choosing light, dark, or adaptive app theme behavior.
 * Caller: Settings appearance route.
 * Dependencies: Uniwind theme controls, react-i18next, local tick icon, HeroUI Native ListGroup, theme colors.
 * Main Functions: AppearanceSettingsScreen()
 * Side Effects: Persists the selected Uniwind theme mode.
 */

import { useTranslation } from "react-i18next"
import { useGuardedRouter as useRouter } from "@/modules/navigation"

import {
  SettingsListGroup,
  SettingsNavigationRow,
  SettingsScrollView,
} from "@/modules/settings/ui"
import { useSettingsStore } from "@/modules/settings/store"
import { getLanguageOptions } from "@/modules/localization/language-settings"
import { getDeviceLanguageCode } from "@/modules/localization/i18n"
import { getAppThemeDefinition } from "@/modules/ui/theme-registry"

export default function AppearanceSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const languageCode = useSettingsStore((state) => state.languageCode)
  const themeId = useSettingsStore((state) => state.themeConfig.themeId)
  const languageOptions = getLanguageOptions()
  const currentOption = languageOptions.find((o) => o.code === languageCode)
  const deviceLanguage = getDeviceLanguageCode()
  const languageLabel = currentOption ? t(currentOption.labelKey) : languageCode
  const themeDefinition = getAppThemeDefinition(themeId)
  const themeLabel = t(themeDefinition.labelKey)
  const displayLanguage =
    languageCode === deviceLanguage
      ? `${languageLabel} ${t("settings.appearance.systemSuffix")}`
      : languageLabel

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
          description={t("settings.appearance.languageDescription", { language: displayLanguage })}
          onPress={() => router.push("/settings/language")}
        />
      </SettingsListGroup>
    </SettingsScrollView>
  )
}
