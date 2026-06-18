/**
 * Purpose: Renders the settings hub with grouped routes for app preferences and system options.
 * Caller: Settings root route.
 * Dependencies: Expo Router, react-i18next, settings route definitions, HeroUI Native ListGroup.
 * Main Functions: SettingsScreen()
 * Side Effects: Navigates to settings detail routes.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { SETTINGS_CATEGORY_ROUTES } from "@/modules/settings/routes"
import {
  SettingsListGroup,
  SettingsNavigationRow,
  SettingsScrollView,
} from "@/components/blocks/settings"

export default function SettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <SettingsScrollView>
      <SettingsListGroup>
        {SETTINGS_CATEGORY_ROUTES.map((route) => (
          <SettingsNavigationRow
            key={route.name}
            title={t(route.titleKey)}
            description={route.descriptionKey ? t(route.descriptionKey) : null}
            onPress={() => router.push(`/settings/${route.name}`)}
          />
        ))}
      </SettingsListGroup>
    </SettingsScrollView>
  )
}
