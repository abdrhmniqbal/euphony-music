import { Button, Dialog, ListGroup } from "heroui-native"
import * as Application from "expo-application"
import * as React from "react"
import { Linking, Platform, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"

import { SettingsListGroup, SettingsScrollView } from "@/components/blocks/settings/ui"
import { queryClient } from "@/core/query/query-client"
import {
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings as openNativeBatteryOptimizationSettings,
  requestIgnoreBatteryOptimizations,
} from "@/core/device/battery-optimization"
import { shareCrashLogs } from "@/core/log/service"
import { showAppToast } from "@/core/ui/toast"
import { preferenceStore } from "@/core/preferences/store"
import { useGuardedRouter } from "@/core/navigation"
import { clearPlayHistory } from "@/domains/history/repository"
import {
  HISTORY_RECENTLY_PLAYED_KEY,
  HISTORY_TOP_TRACKS_KEY,
  RECENT_SEARCHES_KEY,
} from "@/domains/library/query-keys"
import { clearRecentSearches } from "@/domains/search/repository"
import { forceUpdateMixes } from "@/domains/mixes/repository"
import { mixKeys } from "@/domains/mixes/queries"

const BATTERY_SETTINGS_ACTION = "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"

export function AdvancedSettings() {
  const router = useGuardedRouter()
  const { t } = useTranslation()

  const resetHistoryMutation = useMutation({ mutationFn: clearPlayHistory })
  const [isResetHistoryDialogOpen, setIsResetHistoryDialogOpen] = React.useState(false)
  const [isResetSearchHistoryDialogOpen, setIsResetSearchHistoryDialogOpen] = React.useState(false)
  const [isForceUpdateMixesDialogOpen, setIsForceUpdateMixesDialogOpen] = React.useState(false)
  const [isResettingSearchHistory, setIsResettingSearchHistory] = React.useState(false)
  const [isForceUpdatingMixes, setIsForceUpdatingMixes] = React.useState(false)

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
    if (resetHistoryMutation.isPending) {
      return
    }

    try {
      await resetHistoryMutation.mutateAsync()
      await queryClient.invalidateQueries({ queryKey: [HISTORY_RECENTLY_PLAYED_KEY] })
      await queryClient.invalidateQueries({ queryKey: [HISTORY_TOP_TRACKS_KEY] })
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
      await queryClient.invalidateQueries({ queryKey: [RECENT_SEARCHES_KEY] })
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
        t("settings.advanced.mixesUpdatedTitle"),
        t("settings.advanced.mixesUpdatedDescription")
      )
    } catch {
      showAppToast(
        t("settings.advanced.mixesUnableTitle"),
        t("settings.advanced.tryAgainDescription")
      )
    } finally {
      setIsForceUpdatingMixes(false)
    }
  }

  async function openBatteryOptimizationSettings() {
    if (Platform.OS !== "android") {
      await Linking.openSettings()
      return
    }

    const appPackage = Application.applicationId || "com.startune.music"

    try {
      if (await isIgnoringBatteryOptimizations(appPackage)) {
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
    router.replace("/onboarding")
  }

  return (
    <>
      <SettingsScrollView>
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.logs")}
        </Text>
        <SettingsListGroup>
          <ListGroup.Item onPress={() => router.push("/settings/log-level")}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.routes.logLevel.title")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.routes.logLevel.description")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <ListGroup.Item onPress={() => void handleShareCrashLogs()}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.advanced.shareCrashLogs")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.advanced.shareCrashLogsDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </SettingsListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.history")}
        </Text>
        <SettingsListGroup>
          <ListGroup.Item
            onPress={() => setIsResetHistoryDialogOpen(true)}
            disabled={resetHistoryMutation.isPending}
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
          <ListGroup.Item
            onPress={() => setIsResetSearchHistoryDialogOpen(true)}
            disabled={isResettingSearchHistory}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.advanced.resetSearchHistory")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.advanced.resetSearchHistoryDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
          </ListGroup.Item>
          <ListGroup.Item
            onPress={() => setIsForceUpdateMixesDialogOpen(true)}
            disabled={isForceUpdatingMixes}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.advanced.forceUpdateMixes")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.advanced.forceUpdateMixesDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        </SettingsListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.background")}
        </Text>
        <SettingsListGroup>
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
        </SettingsListGroup>

        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.advanced.sections.onboarding")}
        </Text>
        <SettingsListGroup>
          <ListGroup.Item onPress={restartOnboarding}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.routes.onboarding.title")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.advanced.restartOnboardingDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </SettingsListGroup>
      </SettingsScrollView>

      <Dialog isOpen={isResetHistoryDialogOpen} onOpenChange={setIsResetHistoryDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay isCloseOnPress />
          <Dialog.Content className="gap-4" isSwipeable>
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.advanced.resetListeningHistoryTitle")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.advanced.resetListeningHistoryDialogDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsResetHistoryDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onPress={() => void handleConfirmResetHistory()}
                isDisabled={resetHistoryMutation.isPending}
              >
                {t("common.confirm")}
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
          <Dialog.Overlay isCloseOnPress />
          <Dialog.Content className="gap-4" isSwipeable>
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.advanced.searchHistoryResetTitle")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.advanced.resetSearchHistoryDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsResetSearchHistoryDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={() => void handleConfirmResetSearchHistory()}>
                {t("common.confirm")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={isForceUpdateMixesDialogOpen} onOpenChange={setIsForceUpdateMixesDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay isCloseOnPress />
          <Dialog.Content className="gap-4" isSwipeable>
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.advanced.forceUpdateMixes")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.advanced.forceUpdateMixesDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsForceUpdateMixesDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={() => void handleConfirmForceUpdateMixes()}>
                {t("common.confirm")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
