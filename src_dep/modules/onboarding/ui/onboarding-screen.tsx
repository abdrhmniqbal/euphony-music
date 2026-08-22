/**
 * Purpose: Complete onboarding wizard for first app open and manual restart.
 * Caller: Root layout and settings restart action.
 * Dependencies: Uniwind, folder filter settings, media permissions, battery optimization helpers.
 */

import * as Application from "expo-application"
import { Button } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { Uniwind } from "uniwind"

import { startIndexing } from "@/modules/indexer/service"
import { useGuardedRouter as useRouter } from "@/modules/navigation"
import {
  commitFolderFilterConfig,
  type FolderFilterConfig,
  type FolderFilterMode,
  normalizeFolderPath,
} from "@/modules/settings/folder-filters"
import { useSettingsStore } from "@/modules/settings/store"
import { useThemeColors } from "@/modules/ui/theme"
import { showAppToast } from "@/modules/ui/toast"
import { preferenceStore, usePreferenceStore } from "@/stores/preference/store"

import { useOnboardingPermissions } from "../hooks/use-onboarding-permissions"
import { OnboardingWelcome } from "./onboarding-welcome"
import { ThemeStep } from "./theme-step"
import { FolderFilterStep } from "./folder-filter-step"
import { PermissionsStep } from "./permissions-step"
import { RestoreStep } from "./restore-step"
import * as DocumentPicker from "expo-document-picker"
import { restorePreferencesFromFile } from "@/modules/settings/backup"

type ThemeValue = "light" | "dark" | "system"
type Step = 0 | 1 | 2 | 3

export default function OnboardingScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const currentMode = usePreferenceStore((state) => state.theme) as ThemeValue
  const theme = useThemeColors()
  const folderFilterConfig = useSettingsStore((state) => state.folderFilterConfig)
  const [step, setStep] = React.useState<Step>(0)

  const [pendingConfig, setPendingConfig] = React.useState<FolderFilterConfig>({
    whitelist: Array.isArray(folderFilterConfig?.whitelist) ? folderFilterConfig.whitelist : [],
    blacklist: Array.isArray(folderFilterConfig?.blacklist) ? folderFilterConfig.blacklist : [],
  })
  const [selectedMode, setSelectedMode] = React.useState<FolderFilterMode>(
    pendingConfig.whitelist.length > 0 ? "whitelist" : "blacklist"
  )

  const activeFolders =
    selectedMode === "whitelist" ? pendingConfig.whitelist : pendingConfig.blacklist

  const appName = Application.applicationName || t("common.appName")

  const {
    mediaPermission,
    notificationPermissionGranted,
    batteryOptimizationDisabled,
    requestMediaPermission,
    requestNotificationPermission,
    requestBatteryOptimization,
  } = useOnboardingPermissions({ showToast: showAppToast })

  function getModeLabel() {
    return selectedMode === "whitelist"
      ? t("settings.library.whitelist")
      : t("settings.library.blacklist")
  }

  function setUnifiedMode(mode: FolderFilterMode) {
    if (mode === selectedMode) {
      return
    }

    setSelectedMode(mode)
    setPendingConfig((prev) => {
      const folders = Array.from(new Set([...prev.whitelist, ...prev.blacklist]))
      return mode === "whitelist"
        ? { whitelist: folders, blacklist: [] }
        : { whitelist: [], blacklist: folders }
    })
  }

  function handleThemeChange(value: ThemeValue) {
    Uniwind.setTheme(value)
    preferenceStore.setState({ theme: value })
  }

  async function pickFolder() {
    try {
      const { Directory } = await import("expo-file-system")
      if (typeof Directory?.pickDirectoryAsync !== "function") {
        return
      }

      const directory = await Directory.pickDirectoryAsync()
      if (!directory?.uri) {
        return
      }

      const normalizedPath = normalizeFolderPath(directory.uri)
      if (!normalizedPath) {
        return
      }

      setPendingConfig((prev) => {
        const whitelist = prev.whitelist.filter((p) => p !== normalizedPath)
        const blacklist = prev.blacklist.filter((p) => p !== normalizedPath)
        if (selectedMode === "whitelist") {
          whitelist.push(normalizedPath)
        } else {
          blacklist.push(normalizedPath)
        }
        return { whitelist, blacklist }
      })
      showAppToast(t("settings.library.addNewFolder"), t("common.feedback.folderAdded"))
    } catch {
      // User cancelled picker.
    }
  }

  function removeFolder(path: string) {
    setPendingConfig((prev) => ({
      whitelist: prev.whitelist.filter((p) => p !== path),
      blacklist: prev.blacklist.filter((p) => p !== path),
    }))
  }

  async function finishOnboarding() {
    await commitFolderFilterConfig(pendingConfig)
    preferenceStore.setState({ completedOnboarding: true })
    void startIndexing(false, true)
    router.replace("/(main)")
  }

  async function handleOnboardingRestore() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets[0]?.uri) return

      const success = await restorePreferencesFromFile(result.assets[0].uri)
      if (success) {
        showAppToast("Restore Successful", "Preferences restored.")
        preferenceStore.setState({ completedOnboarding: true })
        router.replace("/(main)")
      } else {
        showAppToast("Restore Failed", "Invalid backup file.")
      }
    } catch {
      showAppToast("Restore Failed", t("settings.advanced.tryAgainDescription"))
    }
  }

  function nextStep() {
    if (step < 3) {
      setStep((step + 1) as Step)
      return
    }

    void finishOnboarding()
  }

  function previousStep() {
    if (step > 0) {
      setStep((step - 1) as Step)
    }
  }

  const stepTitle =
    step === 0
      ? t("settings.routes.appearance.title")
      : step === 1
        ? t("settings.routes.folderFilters.title")
        : step === 2
          ? t("onboarding.permissions.title")
          : t("onboarding.restore.title")

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 32 }}
      >
        <View className="gap-6 px-4 py-4">
          <OnboardingWelcome step={step} appName={appName} />

          {step === 0 && (
            <ThemeStep
              stepTitle={stepTitle}
              currentMode={currentMode}
              accentColor={theme.accent}
              onThemeChange={handleThemeChange}
            />
          )}

          {step === 1 && (
            <FolderFilterStep
              activeFolders={activeFolders}
              selectedMode={selectedMode}
              foregroundColor={theme.foreground}
              mutedColor={theme.muted}
              getModeLabel={getModeLabel}
              onToggleMode={() =>
                setUnifiedMode(selectedMode === "whitelist" ? "blacklist" : "whitelist")
              }
              onPickFolder={pickFolder}
              onRemoveFolder={removeFolder}
            />
          )}

          {step === 2 && (
            <PermissionsStep
              stepTitle={stepTitle}
              mediaPermission={mediaPermission}
              notificationPermissionGranted={notificationPermissionGranted}
              batteryOptimizationDisabled={batteryOptimizationDisabled}
              onRequestMediaPermission={() =>
                requestMediaPermission(
                  t("settings.routes.library.title"),
                  t("common.feedback.mediaGranted")
                )
              }
              onRequestNotificationPermission={requestNotificationPermission}
              onRequestBatteryOptimization={requestBatteryOptimization}
            />
          )}

          {step === 3 && <RestoreStep stepTitle={stepTitle} onRestore={handleOnboardingRestore} />}
        </View>
      </ScrollView>

      <View
        className="gap-3 border-t border-border px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button size="lg" className="w-full rounded-full" onPress={nextStep}>
          <Button.Label>{step === 3 ? t("common.finish") : t("common.next")}</Button.Label>
        </Button>
        {step > 0 ? (
          <Button variant="ghost" className="w-full rounded-full" onPress={previousStep}>
            <Button.Label>{t("common.goBack")}</Button.Label>
          </Button>
        ) : null}
      </View>
    </SafeAreaView>
  )
}
