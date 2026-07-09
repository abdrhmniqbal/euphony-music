/**
 * Purpose: Renders notification preferences for indexing progress and app update alerts.
 * Caller: Settings notifications route.
 * Dependencies: HeroUI Native ListGroup and Switch, react-i18next, settings store, indexer notification service, app update settings.
 * Main Functions: NotificationSettingsScreen()
 * Side Effects: Persists notification preferences and may dismiss active indexing notifications.
 */

import { useTranslation } from "react-i18next"

import { dismissIndexerProgressNotification } from "@/modules/indexer/notification"
import { setAppUpdateConfig } from "@/modules/settings/app-updates"
import { setIndexerNotificationsEnabled } from "@/modules/settings/indexer-notifications"
import { useSettingsStore } from "@/modules/settings/store"
import {
  SettingsHighlight,
  SettingsListGroup,
  SettingsScrollView,
  SettingsSwitchRow,
} from "@/modules/settings/ui"

export default function NotificationSettingsScreen() {
  const { t } = useTranslation()
  const indexerNotificationsEnabled = useSettingsStore((state) => state.indexerNotificationsEnabled)
  const appUpdateNotificationsEnabled = useSettingsStore(
    (state) => state.appUpdateConfig.notificationsEnabled
  )

  return (
    <SettingsScrollView>
      <SettingsListGroup>
        <SettingsHighlight id="appUpdateNotifications">
          <SettingsSwitchRow
            title={t("settings.notifications.appUpdateNotifications")}
            description={
              appUpdateNotificationsEnabled
                ? t("settings.notifications.appUpdateNotificationsEnabled")
                : t("settings.notifications.appUpdateNotificationsDisabled")
            }
            isSelected={appUpdateNotificationsEnabled}
            onSelectedChange={(isSelected) => {
              void setAppUpdateConfig({
                notificationsEnabled: isSelected,
              })
            }}
          />
        </SettingsHighlight>
        <SettingsHighlight id="indexerNotifications">
          <SettingsSwitchRow
            title={t("settings.notifications.indexerNotifications")}
            description={
              indexerNotificationsEnabled
                ? t("settings.notifications.indexerNotificationsEnabled")
                : t("settings.notifications.indexerNotificationsDisabled")
            }
            isSelected={indexerNotificationsEnabled}
            onSelectedChange={(isSelected) => {
              void setIndexerNotificationsEnabled(isSelected)

              if (!isSelected) {
                void dismissIndexerProgressNotification()
              }
            }}
          />
        </SettingsHighlight>
      </SettingsListGroup>
    </SettingsScrollView>
  )
}
