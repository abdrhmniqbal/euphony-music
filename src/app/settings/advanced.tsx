/**
 * Purpose: Renders advanced maintenance and device-behavior settings for logs, listening history, background activity, and preview releases.
 * Caller: Settings advanced route.
 * Dependencies: Expo application metadata, HeroUI Native ListGroup, dialog/toast, react-i18next, battery optimization helpers, logging service, history mutations, app update settings.
 * Main Functions: AdvancedSettingsScreen()
 * Side Effects: Opens system settings, shares logs, clears listening history, persists update preferences, and launches external background-activity guidance.
 */

import * as Application from "expo-application"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button, Dialog, ListGroup, Separator } from "heroui-native"
import { useState } from "react"
import { Linking, Platform, View, Text } from "react-native"
import { useTranslation } from "react-i18next"
import { SettingsHighlight, SettingsScrollView } from "@/components/blocks/settings"

import {
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings as openNativeBatteryOptimizationSettings,
  requestIgnoreBatteryOptimizations,
} from "@/modules/device/battery-optimization"
import { useResetListeningHistory } from "@/modules/history/mutations"
import { shareCrashLogs } from "@/modules/logging/service"

import { useSettingsStore } from "@/modules/settings/store"
import { showAppToast } from "@/modules/ui/toast"
import { preferenceStore } from "@/stores/preference/store"

export default function AdvancedSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const loggingLevel = useSettingsStore((state) => state.loggingConfig.level)

  const resetListeningHistoryMutation = useResetListeningHistory()
  const [isResetHistoryDialogOpen, setIsResetHistoryDialogOpen] = useState(false)

  const isResettingHistory = resetListeningHistoryMutation.isPending

  async function handleShareCrashLogs() {
    const result = await shareCrashLogs()
    showAppToast(
      result.shared
        ? t("settings.advanced.logsReadyTitle")
        : t("settings.advanced.logsUnableTitle"),
      result.shared
        ? t("settings.advanced.logsReadyDescription")
        : result.reason || t("settings.advanced.tryAgainDescription")
    )
  }

  async function handleConfirmResetHistory() {
    if (isResettingHistory) {
      return
    }

    try {
      await resetListeningHistoryMutation.mutateAsync()
      setIsResetHistoryDialogOpen(false)
      showAppToast(
        t("settings.advanced.historyResetTitle"),
        t("settings.advanced.historyResetDescription")
      )
    } catch {
      showAppToast(
        t("settings.advanced.historyResetUnableTitle"),
        t("settings.advanced.tryAgainDescription")
      )
    }
  }

  async function openBatteryOptimizationSettings() {
    const appPackage = Application.applicationId || "com.startune.music"
    const BATTERY_SETTINGS_ACTION = "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"

    try {
      if (Platform.OS !== "android") {
        await Linking.openSettings()
        return
      }

      if (await isIgnoringBatteryOptimizations(appPackage)) {
        showAppToast(
          t("settings.advanced.batteryAlreadyDisabledTitle"),
          t("settings.advanced.batteryAlreadyDisabledDescription")
        )
        return
      }

      const requestResult = await requestIgnoreBatteryOptimizations(appPackage)
      if (requestResult === "dialog_opened" || requestResult === "settings_opened") {
        return
      }

      if (await openNativeBatteryOptimizationSettings()) {
        return
      }

      try {
        await Linking.sendIntent(BATTERY_SETTINGS_ACTION)
        return
      } catch {
        // Fall through to app settings.
      }
    } catch {
      // Fallback to app settings.
    }

    await Linking.openSettings()
  }

  async function openDontKillMyApp() {
    try {
      await Linking.openURL("https://dontkillmyapp.com")
    } catch {
      showAppToast(
        t("settings.advanced.unableToOpenLinkTitle"),
        t("settings.advanced.tryAgainDescription")
      )
    }
  }

  function restartOnboarding() {
    preferenceStore.setState({ completedOnboarding: false })
    router.push("/onboarding")
  }

  return (
    <>
      <SettingsScrollView>
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.logs")}
        </Text>
        <ListGroup>
          <SettingsHighlight id="logLevel">
            <ListGroup.Item onPress={() => router.push("/settings/log-level")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.routes.logLevel.title")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {loggingLevel === "extra"
                    ? t("settings.advanced.logExtraDescription")
                    : t("settings.advanced.logMinimalDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </SettingsHighlight>
          <Separator className="mx-4" />
          <SettingsHighlight id="shareCrashLogs">
            <ListGroup.Item
              onPress={() => {
                void handleShareCrashLogs()
              }}
            >
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.advanced.shareCrashLogs")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.advanced.shareCrashLogsDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </SettingsHighlight>
        </ListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.history")}
        </Text>
        <ListGroup>
          <SettingsHighlight id="resetHistory">
            <ListGroup.Item
              onPress={() => setIsResetHistoryDialogOpen(true)}
              disabled={isResettingHistory}
            >
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.advanced.resetListeningHistory")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.advanced.resetListeningHistoryDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </SettingsHighlight>
        </ListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.background")}
        </Text>
        <ListGroup>
          <SettingsHighlight id="batteryOptimization">
            <ListGroup.Item
              onPress={() => {
                void openBatteryOptimizationSettings()
              }}
            >
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.advanced.disableBatteryOptimization")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {Platform.OS === "android"
                    ? t("settings.advanced.disableBatteryOptimizationAndroid")
                    : t("settings.advanced.openSystemSettings")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </SettingsHighlight>
          <Separator className="mx-4" />
          <SettingsHighlight id="dontKillMyApp">
            <ListGroup.Item
              onPress={() => {
                void openDontKillMyApp()
              }}
            >
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.advanced.dontKillMyApp")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.advanced.dontKillMyAppDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </SettingsHighlight>
        </ListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.onboarding", "Onboarding")}
        </Text>
        <ListGroup>
          <SettingsHighlight id="restartOnboarding">
            <ListGroup.Item onPress={restartOnboarding}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.advanced.restartOnboarding", "Restart onboarding")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t(
                    "settings.advanced.restartOnboardingDescription",
                    "Run theme, folder, permission, and battery setup again."
                  )}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </SettingsHighlight>
        </ListGroup>
      </SettingsScrollView>

      <Dialog isOpen={isResetHistoryDialogOpen} onOpenChange={setIsResetHistoryDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.advanced.resetDialogTitle")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.advanced.resetDialogDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                onPress={() => setIsResetHistoryDialogOpen(false)}
                isDisabled={isResettingHistory}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  void handleConfirmResetHistory()
                }}
                isDisabled={isResettingHistory}
              >
                {t("common.reset")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
