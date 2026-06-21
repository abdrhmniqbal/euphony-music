/**
 * Purpose: Renders advanced maintenance and device-behavior settings for logs, listening history, background activity, and preview releases.
 * Caller: Settings advanced route.
 * Dependencies: Expo application metadata, HeroUI Native ListGroup, dialog/toast, react-i18next, battery optimization helpers, logging service, history mutations, app update settings.
 * Main Functions: AdvancedSettingsScreen()
 * Side Effects: Opens system settings, shares logs, clears listening history, persists update preferences, and launches external background-activity guidance.
 */

import * as Application from "expo-application"
import * as DocumentPicker from "expo-document-picker"
import * as Sharing from "expo-sharing"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button, Dialog, ListGroup, Separator, Switch } from "heroui-native"
import { useState } from "react"
import { Linking, Platform, ScrollView, View, Text } from "react-native"
import { useTranslation } from "react-i18next"

import { backupPreferencesToFile, restorePreferencesFromFile } from "@/modules/settings/backup"
import {
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings as openNativeBatteryOptimizationSettings,
  requestIgnoreBatteryOptimizations,
} from "@/modules/device/battery-optimization"
import { useResetListeningHistory } from "@/modules/history/mutations"
import { shareCrashLogs } from "@/modules/logging/service"
import { setAppUpdateConfig } from "@/modules/settings/app-updates"
import { useSettingsStore } from "@/modules/settings/store"
import { showAppToast } from "@/modules/ui/toast"
import { preferenceStore, usePreferenceStore } from "@/stores/preference/store"

export default function AdvancedSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const loggingLevel = useSettingsStore((state) => state.loggingConfig.level)
  const includePrereleases = useSettingsStore((state) => state.appUpdateConfig.includePrereleases)
  const resetListeningHistoryMutation = useResetListeningHistory()
  const [isResetHistoryDialogOpen, setIsResetHistoryDialogOpen] = useState(false)
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)

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

  async function handleBackup() {
    try {
      const uri = await backupPreferencesToFile()
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: "public.json", mimeType: "application/json" })
      }
      setIsBackupDialogOpen(false)
    } catch {
      showAppToast("Backup Failed", t("settings.advanced.tryAgainDescription"))
    }
  }

  async function handleRestore() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets[0]?.uri) return
      
      const success = await restorePreferencesFromFile(result.assets[0].uri)
      if (success) {
        showAppToast("Restore Successful", "Preferences restored.")
      } else {
        showAppToast("Restore Failed", "Invalid backup file.")
      }
      setIsRestoreDialogOpen(false)
    } catch {
      showAppToast("Restore Failed", t("settings.advanced.tryAgainDescription"))
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
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5 px-4 py-4">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            Backup & Restore
          </Text>
          <ListGroup>
            <ListGroup.Item onPress={() => setIsBackupDialogOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Backup Preferences</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>Export settings and preferences to file.</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => setIsRestoreDialogOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Restore Preferences</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>Import settings from backup file.</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>

          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.advanced.sections.logs")}
          </Text>
          <ListGroup>
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
            <Separator className="mx-4" />
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
          </ListGroup>

          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.advanced.sections.history")}
          </Text>
          <ListGroup>
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
          </ListGroup>

          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.advanced.sections.background")}
          </Text>
          <ListGroup>
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
            <Separator className="mx-4" />
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
          </ListGroup>

          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.advanced.sections.onboarding", "Onboarding")}
          </Text>
          <ListGroup>
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
          </ListGroup>

          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.advanced.sections.updates")}
          </Text>
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.advanced.joinPreviewReleases")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {includePrereleases
                    ? t("settings.advanced.joinPreviewReleasesEnabled")
                    : t("settings.advanced.joinPreviewReleasesDisabled")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isSelected={includePrereleases}
                  onSelectedChange={(isSelected) => {
                    void setAppUpdateConfig({
                      includePrereleases: isSelected,
                    })
                  }}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>
      </ScrollView>

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

      <Dialog isOpen={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>Backup Preferences</Dialog.Title>
              <Dialog.Description>
                Export all your settings and preferences to a file.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsBackupDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={handleBackup}>
                Backup
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>Restore Preferences</Dialog.Title>
              <Dialog.Description>
                Import settings from a backup file. This will override current preferences.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsRestoreDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={handleRestore}>
                Restore
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
