/**
 * Purpose: Presents shared app update details in a bottom sheet.
 * Caller: Root app layout.
 * Dependencies: App update prompt store, app update settings, HeroUI Native bottom sheet/buttons.
 * Main Functions: AppUpdateSheet()
 * Side Effects: Opens release/download URL and persists reminder settings.
 */

import {
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet"
import { BottomSheet, Button } from "heroui-native"
import * as React from "react"
import { Linking, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ReleaseNotesMarkdown } from "@/components/blocks/release-notes-markdown"
import { setAppUpdateConfig } from "@/modules/settings/app-updates"
import { closeAppUpdatePrompt, useAppUpdatePromptStore } from "@/modules/updates/app-update.store"

export function AppUpdateSheet() {
  const { t } = useTranslation()
  const isOpen = useAppUpdatePromptStore((state) => state.isOpen)
  const updateInfo = useAppUpdatePromptStore((state) => state.updateInfo)
  const snapPoints = React.useMemo(() => ["48%", "88%"], [])

  const handleDownload = React.useCallback(async () => {
    if (!updateInfo?.downloadUrl) {
      return
    }

    closeAppUpdatePrompt()
    await Linking.openURL(updateInfo.downloadUrl)
  }, [updateInfo?.downloadUrl])

  const handleDontRemind = React.useCallback(async () => {
    await setAppUpdateConfig({ notificationsEnabled: false })
    closeAppUpdatePrompt()
  }, [])

  const renderFooter = React.useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View className="gap-2 bg-background px-4 pb-safe-offset-3 pt-2">
          <Button variant="primary" onPress={() => void handleDownload()}>
            <Button.Label>{t("updates.downloadAndInstall")}</Button.Label>
          </Button>
          <View className="flex-row gap-2">
            <Button variant="secondary" className="flex-1" onPress={() => void handleDontRemind()}>
              <Button.Label>{t("updates.dontRemind")}</Button.Label>
            </Button>
            <Button variant="ghost" className="flex-1" onPress={closeAppUpdatePrompt}>
              <Button.Label>{t("updates.later")}</Button.Label>
            </Button>
          </View>
        </View>
      </BottomSheetFooter>
    ),
    [handleDontRemind, handleDownload, t]
  )

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeAppUpdatePrompt()
        }
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={snapPoints}
          enableOverDrag={false}
          enableDynamicSizing={false}
          footerComponent={renderFooter}
          contentContainerClassName="h-full px-0"
          handleComponent={() => null}
          backgroundClassName="bg-background"
        >
          <View className="flex-row items-center justify-between gap-4 px-4 pb-3">
            <BottomSheet.Title className="flex-1 text-xl font-bold">
              {t("updates.sheetTitle")}
            </BottomSheet.Title>
            <BottomSheet.Close />
          </View>

          <BottomSheetScrollView
            contentContainerClassName="px-4 pb-safe-offset-28"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-base font-semibold text-foreground">
              {t("updates.versionChange", {
                currentVersion: updateInfo?.currentVersion || t("common.unknown"),
                newVersion: updateInfo?.newVersion || t("common.unknown"),
              })}
            </Text>

            {updateInfo?.prerelease ? (
              <Text className="mt-2 text-xs font-semibold text-accent">
                {t("updates.previewRelease")}
              </Text>
            ) : null}

            <Text className="mt-5 text-sm font-semibold text-foreground">
              {t("updates.whatsNew")}
            </Text>
            <View className="mt-2">
              <ReleaseNotesMarkdown
                markdown={updateInfo?.body?.trim() || t("updates.noReleaseNotes")}
              />
            </View>
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
