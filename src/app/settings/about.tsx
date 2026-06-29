/**
 * Purpose: Renders app metadata, update actions, and links to the project repository.
 * Caller: Settings about route.
 * Dependencies: Expo application metadata, Expo image, react-i18next, React Native linking, HeroUI Native ListGroup/Toast, update services.
 * Main Functions: AboutSettingsScreen()
 * Side Effects: Opens external links, fetches GitHub releases for manual update checks, and navigates to detail screens.
 */

import * as Application from "expo-application"
import { Image } from "expo-image"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Linking, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useState } from "react"

import appIcon from "@/assets/icon.png"
import {
  SettingsHighlight,
  SettingsListGroup,
  SettingsNavigationRow,
  SettingsScrollView,
  SettingsSwitchRow,
} from "@/components/blocks/settings"
import { ensureAppUpdateConfigLoaded, setAppUpdateConfig } from "@/modules/settings/app-updates"
import { checkForAppUpdate, getCurrentAppVersion } from "@/modules/updates/app-update-service"
import { openAppUpdatePrompt } from "@/modules/updates/app-update-store"
import { showAppToast } from "@/modules/ui/toast"
import { useSettingsStore } from "@/modules/settings/store"

export default function AboutSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const includePrereleases = useSettingsStore((state) => state.appUpdateConfig.includePrereleases)
  const appName = Application.applicationName || "Startune Music"
  const version = getCurrentAppVersion()
  const repositoryUrl = "https://github.com/abdrhmniqbal/startune-music"
  const crowdinUrl = "https://crowdin.com/project/startune-music/"

  async function handleCheckForUpdates() {
    if (isCheckingForUpdates) {
      return
    }

    setIsCheckingForUpdates(true)
    try {
      const settings = await ensureAppUpdateConfigLoaded()
      const update = await checkForAppUpdate({
        currentVersion: version,
        settings,
        throwOnError: true,
      })

      if (update) {
        openAppUpdatePrompt(update)
        return
      }

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
          {t("settings.about.sections.updates", "Updates")}
        </Text>
        <SettingsListGroup>
          <SettingsHighlight id="updates">
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
          </SettingsHighlight>
          <SettingsHighlight id="previewReleases">
            <SettingsSwitchRow
              title={t("settings.advanced.joinPreviewReleases")}
              description={
                includePrereleases
                  ? t("settings.advanced.joinPreviewReleasesEnabled")
                  : t("settings.advanced.joinPreviewReleasesDisabled")
              }
              isSelected={includePrereleases}
              onSelectedChange={(isSelected) => {
                void setAppUpdateConfig({ includePrereleases: isSelected })
              }}
            />
          </SettingsHighlight>
          <SettingsNavigationRow
            title={t("settings.about.whatsNew")}
            description={t("settings.about.whatsNewDescription")}
            onPress={() => {
              router.push("/settings/whats-new")
            }}
          />
        </SettingsListGroup>
      </View>

      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase text-muted">
          {t("settings.about.sections.project", "Project & Legal")}
        </Text>
        <SettingsListGroup>
          <SettingsNavigationRow
            title={t("settings.about.github")}
            description={t("settings.about.repositoryDescription")}
            onPress={() => {
              void Linking.openURL(repositoryUrl)
            }}
          />
          <SettingsNavigationRow
            title={t("settings.about.helpTranslate")}
            description={t("settings.about.helpTranslateDescription")}
            onPress={() => {
              void Linking.openURL(crowdinUrl)
            }}
          />
          <SettingsNavigationRow
            title={t("settings.about.openSourceLicenses", {
              defaultValue: "Open Source Licenses",
            })}
            description={t("settings.about.openSourceLicensesDescription", {
              defaultValue: "Third-party packages and license texts.",
            })}
            onPress={() => {
              router.push("/settings/open-source-licenses")
            }}
          />
        </SettingsListGroup>
      </View>
    </SettingsScrollView>
  )
}
