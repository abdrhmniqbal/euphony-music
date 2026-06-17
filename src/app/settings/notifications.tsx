/**
 * Purpose: Renders notification preferences for indexing progress and app update alerts.
 * Caller: Settings notifications route.
 * Dependencies: HeroUI Native ListGroup and Switch, react-i18next, settings store, indexer notification service, app update settings.
 * Main Functions: NotificationSettingsScreen()
 * Side Effects: Persists notification preferences and may dismiss active indexing notifications.
 */

import { ListGroup, Separator, Switch } from "heroui-native"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { dismissIndexerProgressNotification } from "@/modules/indexer/notification"
import { setAppUpdateConfig } from "@/modules/settings/app-updates"
import { setIndexerNotificationsEnabled } from "@/modules/settings/indexer-notifications"
import { useSettingsStore } from "@/modules/settings/store"

export default function NotificationSettingsScreen() {
  const { t } = useTranslation()
  const indexerNotificationsEnabled = useSettingsStore((state) => state.indexerNotificationsEnabled)
  const appUpdateNotificationsEnabled = useSettingsStore(
    (state) => state.appUpdateConfig.notificationsEnabled
  )

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.notifications.appUpdateNotifications")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {appUpdateNotificationsEnabled
                  ? t("settings.notifications.appUpdateNotificationsEnabled")
                  : t("settings.notifications.appUpdateNotificationsDisabled")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch
                isSelected={appUpdateNotificationsEnabled}
                onSelectedChange={(isSelected) => {
                  void setAppUpdateConfig({
                    notificationsEnabled: isSelected,
                  })
                }}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.notifications.indexerNotifications")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {indexerNotificationsEnabled
                  ? t("settings.notifications.indexerNotificationsEnabled")
                  : t("settings.notifications.indexerNotificationsDisabled")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch
                isSelected={indexerNotificationsEnabled}
                onSelectedChange={(isSelected) => {
                  void setIndexerNotificationsEnabled(isSelected)

                  if (!isSelected) {
                    void dismissIndexerProgressNotification()
                  }
                }}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScrollView>
  )
}
