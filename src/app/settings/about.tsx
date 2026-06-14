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
import { ListGroup, Separator, Toast, useToast } from "heroui-native"
import { Linking, ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useState } from "react"

import appIcon from "@/assets/icon.png"
import { ensureAppUpdateConfigLoaded } from "@/modules/settings/app-updates"
import {
  checkForAppUpdate,
  getCurrentAppVersion,
} from "@/modules/updates/app-update.service"
import { openAppUpdatePrompt } from "@/modules/updates/app-update.store"

export default function AboutSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false)
  const appName = Application.applicationName || "Startune Music"
  const version = getCurrentAppVersion()
  const repositoryUrl = "https://github.com/abdrhmniqbal/startune-music"
  const crowdinUrl = "https://crowdin.com/project/startune-music/"

  function showToast(title: string, description: string) {
    toast.show({
      duration: 2200,
      component: (props) => (
        <Toast {...props} variant="accent" placement="bottom">
          <Toast.Title className="text-sm font-semibold">{title}</Toast.Title>
          <Toast.Description className="text-xs text-muted">
            {description}
          </Toast.Description>
        </Toast>
      ),
    })
  }

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

      showToast(
        t("settings.about.updateCheckUpToDateTitle"),
        t("settings.about.updateCheckUpToDateDescription")
      )
    } catch {
      showToast(
        t("settings.about.updateCheckFailedTitle"),
        t("settings.about.updateCheckFailedDescription")
      )
    } finally {
      setIsCheckingForUpdates(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="flex-row items-center gap-6 bg-background px-2 py-1">
          <Image
            source={appIcon}
            style={{ width: 64, height: 64 }}
            contentFit="contain"
          />
          <View className="flex-1">
            <Text className="text-[17px] font-normal text-foreground">
              {appName}
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-muted">
              v{version || t("common.unknown")}
            </Text>
          </View>
        </View>

        <ListGroup>
          <ListGroup.Item
            onPress={() => {
              void handleCheckForUpdates()
            }}
            disabled={isCheckingForUpdates}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.about.checkForUpdates")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {isCheckingForUpdates
                  ? t("settings.about.checkingForUpdates")
                  : t("settings.about.checkForUpdatesDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item
            onPress={() => {
              router.push("/settings/whats-new")
            }}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.about.whatsNew")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.about.whatsNewDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item
            onPress={() => {
              void Linking.openURL(repositoryUrl)
            }}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.about.github")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.about.repositoryDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item
            onPress={() => {
              void Linking.openURL(crowdinUrl)
            }}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.about.helpTranslate")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.about.helpTranslateDescription")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
          <Separator className="mx-4" />
          <ListGroup.Item
            onPress={() => {
              router.push("/settings/open-source-licenses")
            }}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.about.openSourceLicenses", {
                  defaultValue: "Open Source Licenses",
                })}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.about.openSourceLicensesDescription", {
                  defaultValue: "Third-party packages and license texts.",
                })}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScrollView>
  )
}
