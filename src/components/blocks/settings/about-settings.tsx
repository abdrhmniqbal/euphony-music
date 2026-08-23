import * as Application from "expo-application"
import { Image } from "expo-image"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Linking, Text, View } from "react-native"

import {
  SettingsListGroup,
  SettingsNavigationRow,
  SettingsScrollView,
  SettingsSwitchRow,
} from "@/components/blocks/settings/ui"
import { showAppToast } from "@/core/ui/toast"
import { usePreferenceStore } from "@/core/preferences/store"
import { useGuardedRouter } from "@/core/navigation"
import { getCurrentAppVersion } from "@/core/config/app-version"
import {
  openLatestAppUpdatePrompt,
  updateAppUpdateConfig,
} from "@/domains/updates/app-update-runtime"
import appIcon from "@/assets/icon.png"

const REPOSITORY_URL = "https://github.com/abdrhmniqbal/startune-music"
const CROWDIN_URL = "https://crowdin.com/project/startune-music/"

export function AboutSettings() {
  const router = useGuardedRouter()
  const { t } = useTranslation()
  const includePrereleases = usePreferenceStore(
    (state) => state.appUpdateConfig.includePrereleases
  )
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const appName = Application.applicationName || t("common.appName")
  const version = getCurrentAppVersion()

  async function handleCheckForUpdates() {
    if (isCheckingForUpdates) {
      return
    }

    setIsCheckingForUpdates(true)
    try {
      await openLatestAppUpdatePrompt()
      showAppToast(
        t("settings.about.updateCheckUpToDateTitle"),
        t("settings.about.updateCheckUpToDateDescription")
      )
    } catch {
      showAppToast(
        t("settings.about.updateCheckFailedTitle"),
        t("settings.about.updateCheckFailedDescription")
      )
    } finally {
      setIsCheckingForUpdates(false)
    }
  }

  return (
    <SettingsScrollView>
      <View className="flex-row items-center gap-6 bg-background px-2 py-1">
        <Image source={appIcon} style={{ width: 64, height: 64 }} contentFit="contain" />
        <View className="flex-1">
          <Text className="text-[17px] font-normal text-foreground">{appName}</Text>
          <Text className="mt-1 text-[13px] leading-5 text-muted">
            v{version || t("common.unknown")}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.about.sections.updates")}
        </Text>
        <SettingsListGroup>
          <SettingsNavigationRow
            title={t("settings.about.checkForUpdates")}
            description={
              isCheckingForUpdates
                ? t("settings.about.checkingForUpdates")
                : t("settings.about.checkForUpdatesDescription")
            }
            disabled={isCheckingForUpdates}
            onPress={() => {
              void handleCheckForUpdates()
            }}
          />
          <SettingsSwitchRow
            title={t("settings.advanced.joinPreviewReleases")}
            description={
              includePrereleases
                ? t("settings.advanced.joinPreviewReleasesEnabled")
                : t("settings.advanced.joinPreviewReleasesDisabled")
            }
            isSelected={includePrereleases}
            onSelectedChange={(isSelected) => {
              updateAppUpdateConfig({ includePrereleases: isSelected })
            }}
          />
          <SettingsNavigationRow
            title={t("settings.about.whatsNew")}
            description={t("settings.about.whatsNewDescription")}
            onPress={() => router.push("/settings/whats-new" as never)}
          />
        </SettingsListGroup>
      </View>

      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.about.sections.project")}
        </Text>
        <SettingsListGroup>
          <SettingsNavigationRow
            title={t("settings.about.github")}
            description={t("settings.about.repositoryDescription")}
            onPress={() => void Linking.openURL(REPOSITORY_URL)}
          />
          <SettingsNavigationRow
            title={t("settings.about.helpTranslate")}
            description={t("settings.about.helpTranslateDescription")}
            onPress={() => void Linking.openURL(CROWDIN_URL)}
          />
          <SettingsNavigationRow
            title={t("settings.about.openSourceLicenses")}
            description={t("settings.about.openSourceLicensesDescription")}
            onPress={() => router.push("/settings/open-source-licenses" as never)}
          />
        </SettingsListGroup>
      </View>
    </SettingsScrollView>
  )
}
