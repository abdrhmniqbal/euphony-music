import * as Application from "expo-application"
import { Button, useThemeColor } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"

import { showAppToast } from "@/core/ui/toast"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { ThemeMode } from "@/core/preferences/types"
import { startIndexing } from "@/domains/indexer/service"
import { normalizePath } from "@/domains/indexer/scan/folder-filter"
import { useGuardedRouter } from "@/core/navigation"
import { commitFolderFilterConfig, type FolderFilterMode } from "@/domains/library/folder-filters"
import { OnboardingWelcome } from "./onboarding-welcome"
import { ThemeStep } from "./theme-step"
import { FolderFilterStep } from "./folder-filter-step"
import { PermissionsStep } from "./permissions-step"
import { useOnboardingPermissions } from "./use-onboarding-permissions"

type Step = 0 | 1 | 2

const STEP_COUNT = 3

export function OnboardingScreen() {
  const router = useGuardedRouter()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const currentMode = usePreferenceStore((state) => state.themeMode)
  const [accent, background, foreground, muted] = useThemeColor([
    "accent",
    "background",
    "foreground",
    "muted",
  ])
  const folderFilterConfig = usePreferenceStore((state) => state.folderFilterConfig)
  const [step, setStep] = React.useState<Step>(0)

  const [pendingConfig, setPendingConfig] = React.useState({
    whitelist: folderFilterConfig.whitelist ?? [],
    blacklist: folderFilterConfig.blacklist ?? [],
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
  } = useOnboardingPermissions()

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

  function handleThemeChange(value: ThemeMode) {
    preferenceStore.setState({ themeMode: value })
  }

  async function pickFolder() {
    try {
      const { Directory } = await import("expo-file-system")
      if (!Directory?.pickDirectoryAsync) {
        return
      }

      const directory = await Directory.pickDirectoryAsync()
      if (!directory?.uri) {
        return
      }

      const normalizedPath = normalizePath(directory.uri)
      if (!normalizedPath) {
        return
      }

      setPendingConfig((prev) => {
        const whitelist = prev.whitelist.filter((path) => path !== normalizedPath)
        const blacklist = prev.blacklist.filter((path) => path !== normalizedPath)
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
      whitelist: prev.whitelist.filter((item) => item !== path),
      blacklist: prev.blacklist.filter((item) => item !== path),
    }))
  }

  async function finishOnboarding() {
    await commitFolderFilterConfig(pendingConfig)
    preferenceStore.setState({ completedOnboarding: true })
    void startIndexing(false, true)
    router.replace("/(main)")
  }

  function nextStep() {
    if (step < STEP_COUNT - 1) {
      // SAFETY: step < STEP_COUNT - 1 keeps step + 1 inside the Step union
      setStep((step + 1) as Step)
      return
    }

    void finishOnboarding()
  }

  function previousStep() {
    if (step > 0) {
      // SAFETY: step > 0 keeps step - 1 inside the Step union
      setStep((step - 1) as Step)
    }
  }

  const stepTitle =
    step === 0
      ? t("settings.appearance.title")
      : step === 1
        ? t("onboarding.folders.title")
        : t("onboarding.permissions.title")

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 32 }}
      >
        <View className="gap-6 px-4 py-4">
          <OnboardingWelcome step={step} stepCount={STEP_COUNT} appName={appName} />

          {step === 0 ? (
            <ThemeStep
              stepTitle={stepTitle}
              currentMode={currentMode}
              accentColor={accent}
              onThemeChange={handleThemeChange}
            />
          ) : null}

          {step === 1 ? (
            <FolderFilterStep
              activeFolders={activeFolders}
              selectedMode={selectedMode}
              foregroundColor={foreground}
              mutedColor={muted}
              onSetMode={setUnifiedMode}
              onPickFolder={() => void pickFolder()}
              onRemoveFolder={removeFolder}
            />
          ) : null}

          {step === 2 ? (
            <PermissionsStep
              stepTitle={stepTitle}
              mediaPermission={mediaPermission}
              notificationPermissionGranted={notificationPermissionGranted}
              batteryOptimizationDisabled={batteryOptimizationDisabled}
              onRequestMediaPermission={() => void requestMediaPermission()}
              onRequestNotificationPermission={() => void requestNotificationPermission()}
              onRequestBatteryOptimization={() => void requestBatteryOptimization()}
            />
          ) : null}
        </View>
      </ScrollView>

      <View
        className="gap-3 border-t border-border px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button size="lg" className="w-full rounded-full" onPress={nextStep}>
          <Button.Label>{t("common.next")}</Button.Label>
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
