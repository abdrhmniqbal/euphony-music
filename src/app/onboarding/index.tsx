/**
 * Purpose: Complete onboarding wizard for first app open and manual restart.
 * Caller: Root layout and settings restart action.
 * Dependencies: Uniwind, folder filter settings, media permissions, battery optimization helpers.
 */

import { Image } from "expo-image"
import * as Application from "expo-application"
import * as MediaLibrary from "expo-media-library/legacy"
import * as Notifications from "expo-notifications"
import { BottomSheet, Button, Card, ListGroup, PressableFeedback, Separator } from "heroui-native"
import * as React from "react"
import { Linking, Platform, ScrollView, Text, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { Uniwind, useUniwind } from "uniwind"

import appIcon from "@/assets/icon.png"
import LocalAddIcon from "@/components/icons/local/add"
import LocalCancelIcon from "@/components/icons/local/cancel"
import LocalFolderSolidIcon from "@/components/icons/local/folder-solid"
import LocalTickIcon from "@/components/icons/local/tick"
import { EmptyState } from "@/components/ui/empty-state"
import {
  isIgnoringBatteryOptimizations,
  openBatteryOptimizationSettings as openNativeBatteryOptimizationSettings,
  requestIgnoreBatteryOptimizations,
} from "@/modules/device/battery-optimization"
import { startIndexing } from "@/modules/indexer/service"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import {
  commitFolderFilterConfig,
  type FolderFilterConfig,
  type FolderFilterMode,
  getFolderNameFromPath,
  normalizeFolderPath,
} from "@/modules/settings/folder-filters"
import { useSettingsStore } from "@/modules/settings/store"
import { useThemeColors } from "@/modules/ui/theme"
import { showAppToast } from "@/modules/ui/toast"
import { preferenceStore } from "@/stores/preference/store"

type ThemeValue = "light" | "dark" | "system"
type Step = 0 | 1 | 2

const THEME_OPTIONS: Array<{ value: ThemeValue; labelKey: string }> = [
  { value: "light", labelKey: "settings.appearance.options.light" },
  { value: "dark", labelKey: "settings.appearance.options.dark" },
  { value: "system", labelKey: "settings.appearance.options.system" },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { theme: currentTheme, hasAdaptiveThemes } = useUniwind()
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
  const [mediaPermission, setMediaPermission] = React.useState<boolean | null>(null)
  const [notificationPermissionGranted, setNotificationPermissionGranted] = React.useState(false)
  const [batteryOptimizationDisabled, setBatteryOptimizationDisabled] = React.useState(false)
  const [isModeSheetOpen, setIsModeSheetOpen] = React.useState(false)

  const currentMode: ThemeValue = hasAdaptiveThemes ? "system" : (currentTheme as ThemeValue)
  const activeFolders = selectedMode === "whitelist" ? pendingConfig.whitelist : pendingConfig.blacklist

  const appName = Application.applicationName || t("common.appName")

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

  React.useEffect(() => {
    void checkPermissionStatus()
  }, [])

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
      showAppToast(
        t("settings.library.addNewFolder"),
        t("common.feedback.folderAdded")
      )
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

  async function checkPermissionStatus() {
    const { status } = await MediaLibrary.getPermissionsAsync()
    setMediaPermission(status === "granted")

    const notificationPermissions = await Notifications.getPermissionsAsync()
    setNotificationPermissionGranted(notificationPermissions.granted)

    if (Platform.OS === "android") {
      const appPackage = Application.applicationId || "com.startune.music"
      const isIgnoring = await isIgnoringBatteryOptimizations(appPackage)
      setBatteryOptimizationDisabled(isIgnoring)
    }
  }

  async function requestMediaPermission() {
    const { status } = await MediaLibrary.requestPermissionsAsync()
    const granted = status === "granted"
    setMediaPermission(granted)
    if (granted) {
      showAppToast(
        t("settings.routes.library.title"),
        t("common.feedback.mediaGranted")
      )
    }
  }

  async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync()
    setNotificationPermissionGranted(status === "granted")
  }

  async function requestBatteryOptimization() {
    const appPackage = Application.applicationId || "com.startune.music"
    const BATTERY_SETTINGS_ACTION = "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"

    try {
      if (Platform.OS !== "android") {
        await Linking.openSettings()
        return
      }

      if (await isIgnoringBatteryOptimizations(appPackage)) {
        setBatteryOptimizationDisabled(true)
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
      // Fall through to app settings.
    }

    await Linking.openSettings()
  }

  async function finishOnboarding() {
    await commitFolderFilterConfig(pendingConfig)
    preferenceStore.setState({ completedOnboarding: true })
    void startIndexing(false, true)
    router.replace("/(main)")
  }

  function nextStep() {
    if (step < 2) {
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
        : t("onboarding.permissions.title")

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top", "bottom"]}>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40, paddingTop: 32 }}>
        <View className="gap-6 px-4 py-4">
          <View className="items-center justify-center gap-4 py-6">
            <Image source={appIcon} style={{ width: 80, height: 80 }} contentFit="contain" />
            <View className="items-center gap-1">
              <Text className="text-sm font-medium text-muted">{step + 1} / 3</Text>
              <Text className="text-2xl font-bold text-foreground">
                {t("onboarding.welcomePrefix")} {appName}
              </Text>
              <Text className="text-center text-sm text-muted">
                {t("onboarding.welcomeDescription")}
              </Text>
            </View>
          </View>

          {step === 0 ? (
            <View className="gap-2">
              <Text className="px-1 text-xs font-semibold uppercase text-muted">
                {stepTitle}
              </Text>
              <ListGroup>
                {THEME_OPTIONS.map((option, index) => (
                  <React.Fragment key={option.value}>
                    {index > 0 && <Separator className="mx-4" />}
                    <ListGroup.Item onPress={() => handleThemeChange(option.value)}>
                      <ListGroup.ItemContent>
                        <ListGroup.ItemTitle>
                          {t(option.labelKey)}
                        </ListGroup.ItemTitle>
                      </ListGroup.ItemContent>
                      {currentMode === option.value ? (
                        <ListGroup.ItemSuffix>
                          <LocalTickIcon fill="none" width={24} height={24} color={theme.accent} />
                        </ListGroup.ItemSuffix>
                      ) : null}
                    </ListGroup.Item>
                  </React.Fragment>
                ))}
              </ListGroup>
            </View>
          ) : null}

          {step === 1 ? (
            <View className="gap-5">
              <Card>
                <Card.Body>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4 pb-2">
                      <Card.Title>{t("settings.library.filterMode")}</Card.Title>
                      <Card.Description>
                        {t("settings.library.filterModeDescription")}
                      </Card.Description>
                    </View>
                    <Button variant="secondary" onPress={() => setIsModeSheetOpen(true)}>
                      {getModeLabel()}
                    </Button>
                  </View>
                </Card.Body>
              </Card>

              <View className="flex-row items-center justify-between px-1">
                <Text className="text-[22px] font-semibold tracking-[-0.5px] text-foreground">
                  {t("settings.library.folders")}
                </Text>
                <Button variant="ghost" onPress={pickFolder}>
                  <View className="flex-row items-center gap-2">
                    <LocalAddIcon fill="none" width={18} height={18} color={theme.foreground} />
                    <Text className="font-semibold text-foreground">
                      {t("settings.library.addNewFolder")}
                    </Text>
                  </View>
                </Button>
              </View>

              {activeFolders.length === 0 ? (
                <EmptyState
                  icon={<LocalFolderSolidIcon fill="none" width={40} height={40} color={theme.muted} />}
                  title={t("settings.library.noFoldersAdded")}
                  message={t("settings.library.noFoldersAddedMessage")}
                  className="mt-1"
                />
              ) : (
                <ListGroup>
                  {activeFolders.map((path, index) => (
                    <React.Fragment key={path}>
                      <ListGroup.Item>
                        <ListGroup.ItemContent>
                          <ListGroup.ItemTitle>{getFolderNameFromPath(path)}</ListGroup.ItemTitle>
                          <ListGroup.ItemDescription numberOfLines={2}>{path}</ListGroup.ItemDescription>
                        </ListGroup.ItemContent>
                        <ListGroup.ItemSuffix>
                          <Button variant="ghost" onPress={() => removeFolder(path)} isIconOnly hitSlop={8}>
                            <LocalCancelIcon fill="none" width={18} height={18} color={theme.muted} />
                          </Button>
                        </ListGroup.ItemSuffix>
                      </ListGroup.Item>
                      {index < activeFolders.length - 1 ? <Separator className="mx-4" /> : null}
                    </React.Fragment>
                  ))}
                </ListGroup>
              )}
            </View>
          ) : null}

          {step === 2 ? (
            <View className="gap-2">
              <Text className="px-1 text-xs font-semibold uppercase text-muted">
                {stepTitle}
              </Text>
              <ListGroup>
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>
                      {t("onboarding.permissions.fileAccess")}
                    </ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                      {t("onboarding.permissions.fileAccessDescription")}
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix>
                    <Button
                      variant={mediaPermission ? "secondary" : "primary"}
                      onPress={requestMediaPermission}
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
                      <ListGroup.ItemTitle>
                        {t("onboarding.permissions.notifications")}
                      </ListGroup.ItemTitle>
                      <ListGroup.ItemDescription>
                        {t("onboarding.permissions.notificationsDescription")}
                      </ListGroup.ItemDescription>
                    </ListGroup.ItemContent>
                    <ListGroup.ItemSuffix>
                      <Button
                        variant={notificationPermissionGranted ? "secondary" : "primary"}
                        onPress={requestNotificationPermission}
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
                          onPress={requestBatteryOptimization}
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
          ) : null}
        </View>
      </ScrollView>

      <View
        className="gap-3 border-t border-border px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button size="lg" className="w-full rounded-full" onPress={nextStep}>
          <Button.Label>
            {step === 2
              ? t("common.finish")
              : t("common.next")}
          </Button.Label>
        </Button>
        {step > 0 ? (
          <Button variant="ghost" className="w-full rounded-full" onPress={previousStep}>
            <Button.Label>{t("common.goBack")}</Button.Label>
          </Button>
        ) : null}
      </View>

      <BottomSheet isOpen={isModeSheetOpen} onOpenChange={setIsModeSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content className="gap-1" backgroundClassName="bg-surface">
            <BottomSheet.Title className="mb-1 text-xl">
              {t("settings.library.selectFilterMode")}
            </BottomSheet.Title>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-60"
              onPress={() => {
                setUnifiedMode("whitelist")
                setIsModeSheetOpen(false)
              }}
            >
              <Text
                className={`text-base ${
                  selectedMode === "whitelist" ? "text-accent" : "text-foreground"
                }`}
              >
                {t("settings.library.whitelist")}
              </Text>
              {selectedMode === "whitelist" ? (
                <LocalTickIcon fill="none" width={20} height={20} color={theme.accent} />
              ) : null}
            </PressableFeedback>
            <PressableFeedback
              className="h-14 flex-row items-center justify-between active:opacity-60"
              onPress={() => {
                setUnifiedMode("blacklist")
                setIsModeSheetOpen(false)
              }}
            >
              <Text
                className={`text-base ${
                  selectedMode === "blacklist" ? "text-accent" : "text-foreground"
                }`}
              >
                {t("settings.library.blacklist")}
              </Text>
              {selectedMode === "blacklist" ? (
                <LocalTickIcon fill="none" width={20} height={20} color={theme.accent} />
              ) : null}
            </PressableFeedback>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </SafeAreaView>
  )
}
