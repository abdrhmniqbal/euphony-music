import { useTranslation } from "react-i18next"

import {
  SettingsListGroup,
  SettingsScrollView,
  SettingsSwitchRow,
} from "@/components/blocks/settings/ui"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import { dismissIndexerProgressNotification } from "@/domains/indexer/progress/notification"

export function NotificationsSettings() {
  const { t } = useTranslation()
  const indexerNotificationsEnabled = usePreferenceStore(
    (state) => state.indexerNotificationsEnabled
  )
  const appUpdateNotificationsEnabled = usePreferenceStore(
    (state) => state.appUpdateConfig.notificationsEnabled
  )

  return (
    <SettingsScrollView>
      <SettingsListGroup>
        <SettingsSwitchRow
          title={t("settings.notifications.appUpdateNotifications")}
          description={
            appUpdateNotificationsEnabled
              ? t("settings.notifications.appUpdateNotificationsEnabled")
              : t("settings.notifications.appUpdateNotificationsDisabled")
          }
          isSelected={appUpdateNotificationsEnabled}
          onSelectedChange={(isSelected) => {
            const appUpdateConfig = preferenceStore.getState().appUpdateConfig
            preferenceStore.setState({
              appUpdateConfig: { ...appUpdateConfig, notificationsEnabled: isSelected },
            })
          }}
        />
        <SettingsSwitchRow
          title={t("settings.notifications.indexerNotifications")}
          description={
            indexerNotificationsEnabled
              ? t("settings.notifications.indexerNotificationsEnabled")
              : t("settings.notifications.indexerNotificationsDisabled")
          }
          isSelected={indexerNotificationsEnabled}
          onSelectedChange={(isSelected) => {
            preferenceStore.setState({ indexerNotificationsEnabled: isSelected })

            if (!isSelected) {
              void dismissIndexerProgressNotification()
            }
          }}
        />
      </SettingsListGroup>
    </SettingsScrollView>
  )
}
