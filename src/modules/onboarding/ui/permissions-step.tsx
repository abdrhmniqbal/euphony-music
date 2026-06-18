import { Button, ListGroup, Separator } from "heroui-native"
import { Platform, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

interface PermissionsStepProps {
  stepTitle: string
  mediaPermission: boolean | null
  notificationPermissionGranted: boolean
  batteryOptimizationDisabled: boolean
  onRequestMediaPermission: () => void
  onRequestNotificationPermission: () => void
  onRequestBatteryOptimization: () => void
}

export function PermissionsStep({
  stepTitle,
  mediaPermission,
  notificationPermissionGranted,
  batteryOptimizationDisabled,
  onRequestMediaPermission,
  onRequestNotificationPermission,
  onRequestBatteryOptimization,
}: PermissionsStepProps) {
  const { t } = useTranslation()

  return (
    <View className="gap-2">
      <Text className="px-1 text-xs font-semibold uppercase text-muted">{stepTitle}</Text>
      <ListGroup>
        <ListGroup.Item>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>{t("onboarding.permissions.fileAccess")}</ListGroup.ItemTitle>
            <ListGroup.ItemDescription>
              {t("onboarding.permissions.fileAccessDescription")}
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <Button
              variant={mediaPermission ? "secondary" : "primary"}
              onPress={onRequestMediaPermission}
              isDisabled={mediaPermission === true}
            >
              <Button.Label>
                {mediaPermission
                  ? t("onboarding.permissions.granted")
                  : t("onboarding.permissions.grant")}
              </Button.Label>
            </Button>
          </ListGroup.ItemSuffix>
        </ListGroup.Item>

        <>
          <Separator className="mx-4" />
          <ListGroup.Item>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("onboarding.permissions.notifications")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("onboarding.permissions.notificationsDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Button
                variant={notificationPermissionGranted ? "secondary" : "primary"}
                onPress={onRequestNotificationPermission}
                isDisabled={notificationPermissionGranted}
              >
                <Button.Label>
                  {notificationPermissionGranted
                    ? t("onboarding.permissions.granted")
                    : t("onboarding.permissions.grant")}
                </Button.Label>
              </Button>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </>

        {Platform.OS === "android" ? (
          <>
            <Separator className="mx-4" />
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.advanced.disableBatteryOptimization")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.advanced.disableBatteryOptimizationAndroid")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Button
                  variant={batteryOptimizationDisabled ? "secondary" : "primary"}
                  onPress={onRequestBatteryOptimization}
                  isDisabled={batteryOptimizationDisabled}
                >
                  <Button.Label>
                    {batteryOptimizationDisabled
                      ? t("onboarding.permissions.disabled")
                      : t("onboarding.permissions.disable")}
                  </Button.Label>
                </Button>
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </>
        ) : null}
      </ListGroup>
    </View>
  )
}
