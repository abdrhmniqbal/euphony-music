/**
 * Purpose: Renders advanced maintenance and device-behavior settings for logs, listening history, background activity, and preview releases.
 * Caller: Settings advanced route.
 * Dependencies: Expo application metadata, HeroUI Native ListGroup, dialog/toast, react-i18next, battery optimization helpers, logging service, history mutations, app update settings.
 * Main Functions: AdvancedSettingsScreen()
 * Side Effects: Opens system settings, shares logs, clears listening history, persists update preferences, and launches external background-activity guidance.
 */

import * as Application from "expo-application"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Button, Dialog, ListGroup } from "heroui-native"
import { useState } from "react"
import { Linking, Platform, View, Text } from "react-native"
import { useTranslation } from "react-i18next"
import { SettingsHighlight, SettingsListGroup, SettingsScrollView } from "@/components/blocks/settings"
import { queryClient } from "@/lib/tanstack-query"

import {
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings as openNativeBatteryOptimizationSettings,
  requestIgnoreBatteryOptimizations,
} from "@/modules/device/battery-optimization"
import { useResetListeningHistory } from "@/modules/history/mutations"
import { libraryKeys } from "@/modules/library/keys"
import { mixKeys } from "@/modules/mixes/queries"
import { forceUpdateMixes } from "@/modules/mixes/repository"
import { clearRecentSearches } from "@/modules/library/recent-searches-repository"
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
  const [isResetSearchHistoryDialogOpen, setIsResetSearchHistoryDialogOpen] = useState(false)
  const [isForceUpdateMixesDialogOpen, setIsForceUpdateMixesDialogOpen] = useState(false)
  const [isResettingSearchHistory, setIsResettingSearchHistory] = useState(false)
  const [isForceUpdatingMixes, setIsForceUpdatingMixes] = useState(false)

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

  async function handleConfirmResetSearchHistory() {
    if (isResettingSearchHistory) {
      return
    }

    setIsResettingSearchHistory(true)

    try {
      await clearRecentSearches()
      await queryClient.invalidateQueries({ queryKey: libraryKeys.recentSearches() })
      setIsResetSearchHistoryDialogOpen(false)
      showAppToast(
        t("settings.advanced.searchHistoryResetTitle"),
        t("settings.advanced.searchHistoryResetDescription")
      )
    } catch {
      showAppToast(
        t("settings.advanced.searchHistoryResetUnableTitle"),
        t("settings.advanced.tryAgainDescription")
      )
    } finally {
      setIsResettingSearchHistory(false)
    }
  }

  async function handleConfirmForceUpdateMixes() {
    if (isForceUpdatingMixes) {
      return
    }

    setIsForceUpdatingMixes(true)

    try {
      await forceUpdateMixes()
      await queryClient.invalidateQueries({ queryKey: mixKeys.all })
      setIsForceUpdateMixesDialogOpen(false)
      showAppToast(
        t("settings.advanced.forceUpdateMixesCompleteTitle", "Mixes reset"),
        t(
          "settings.advanced.forceUpdateMixesCompleteDescription",
          "Daily Mix and For You Mix will rebuild from current listening data."
        )
      )
    } catch {
      showAppToast(
        t("settings.advanced.forceUpdateMixesUnableTitle", "Unable to update mixes"),
        t("settings.advanced.tryAgainDescription")
      )
    } finally {
      setIsForceUpdatingMixes(false)
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
        <SettingsListGroup>
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
        </SettingsListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.history")}
        </Text>
        <SettingsListGroup>
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
          <SettingsHighlight id="resetSearchHistory">
            <ListGroup.Item
              onPress={() => setIsResetSearchHistoryDialogOpen(true)}
              disabled={isResettingSearchHistory}
            >
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.advanced.resetSearchHistory")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.advanced.resetSearchHistoryDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </SettingsHighlight>
          <SettingsHighlight id="forceUpdateMixes">
            <ListGroup.Item
              onPress={() => setIsForceUpdateMixesDialogOpen(true)}
              disabled={isForceUpdatingMixes}
            >
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.advanced.forceUpdateMixes", "Force update mixes")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t(
                    "settings.advanced.forceUpdateMixesDescription",
                    "Discard and regenerate Daily Mix and For You Mix immediately."
                  )}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </SettingsHighlight>
        </SettingsListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.background")}
        </Text>
        <SettingsListGroup>
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
        </SettingsListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.onboarding", "Onboarding")}
        </Text>
        <SettingsListGroup>
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
        </SettingsListGroup>
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

      <Dialog
        isOpen={isResetSearchHistoryDialogOpen}
        onOpenChange={setIsResetSearchHistoryDialogOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.advanced.resetSearchHistoryDialogTitle")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.advanced.resetSearchHistoryDialogDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                onPress={() => setIsResetSearchHistoryDialogOpen(false)}
                isDisabled={isResettingSearchHistory}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  void handleConfirmResetSearchHistory()
                }}
                isDisabled={isResettingSearchHistory}
              >
                {t("common.reset")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={isForceUpdateMixesDialogOpen} onOpenChange={setIsForceUpdateMixesDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>
                {t("settings.advanced.forceUpdateMixesDialogTitle", "Force update mixes?")}
              </Dialog.Title>
              <Dialog.Description>
                {t(
                  "settings.advanced.forceUpdateMixesDialogDescription",
                  "This will discard the current Daily Mix and For You Mix and force them to regenerate from your latest history and library taste. Your play history itself will stay unchanged."
                )}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                onPress={() => setIsForceUpdateMixesDialogOpen(false)}
                isDisabled={isForceUpdatingMixes}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  void handleConfirmForceUpdateMixes()
                }}
                isDisabled={isForceUpdatingMixes}
              >
                {t("common.update", "Update")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
