import { BottomSheetFooter, BottomSheetScrollView, type BottomSheetFooterProps } from "@gorhom/bottom-sheet"
import { Accordion, BottomSheet, Button } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ReleaseNotesMarkdown } from "@/domains/updates/ui/release-notes-markdown"
import { closeAppUpdatePrompt, useAppUpdatePromptStore } from "@/domains/updates/app-update-store"
import { updateAppUpdateConfig } from "@/domains/updates/app-update-runtime"
import { downloadAndInstall } from "@/core/device/app-updater"

export function AppUpdateSheet() {
  const { t } = useTranslation()
  const isOpen = useAppUpdatePromptStore((state) => state.isOpen)
  const updateInfo = useAppUpdatePromptStore((state) => state.updateInfo)
  const snapPoints = React.useMemo(() => ["48%", "88%"], [])

  const downloadUrl = updateInfo?.downloadUrl
  const handleDownload = React.useCallback(() => {
    if (!downloadUrl) return
    closeAppUpdatePrompt()
    downloadAndInstall(downloadUrl)
  }, [downloadUrl])

  const handleDontRemind = React.useCallback(() => {
    updateAppUpdateConfig({ notificationsEnabled: false })
    closeAppUpdatePrompt()
  }, [])

  const renderFooter = React.useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View className="gap-2 bg-surface px-4 pb-safe-offset-3 pt-2">
          <Button variant="primary" onPress={handleDownload}>
            <Button.Label>{t("updates.downloadAndInstall")}</Button.Label>
          </Button>
          <Button variant="ghost" onPress={handleDontRemind}>
            <Button.Label>{t("updates.dontRemind")}</Button.Label>
          </Button>
        </View>
      </BottomSheetFooter>
    ),
    [handleDontRemind, handleDownload, t]
  )

  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) closeAppUpdatePrompt()
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay isCloseOnPress />
        <BottomSheet.Content
          snapPoints={snapPoints}
          enableOverDrag={false}
          enableDynamicSizing={false}
          footerComponent={renderFooter}
          contentContainerClassName="h-full px-0"
          backgroundClassName="bg-surface"
        >
          <View className="px-4 pb-3">
            <BottomSheet.Title className="text-xl font-bold">
              {t("updates.sheetTitle")}
            </BottomSheet.Title>
          </View>

          <BottomSheetScrollView
            contentContainerClassName="px-4 pb-safe-offset-28"
            showsVerticalScrollIndicator={false}
          >
            <Text selectable={false} className="text-base font-semibold text-foreground">
              {t("updates.versionChange", {
                currentVersion: updateInfo?.currentVersion || t("common.unknown"),
                newVersion: updateInfo?.newVersion || t("common.unknown"),
              })}
            </Text>
            <Accordion
              selectionMode="single"
              defaultValue={["release-notes"]}
              variant="surface"
              className="mt-4"
            >
              <Accordion.Item value="release-notes">
                <Accordion.Trigger>
                  <View className="flex-1">
                    <Text selectable={false} className="text-base font-semibold text-foreground">
                      {t("updates.whatsNew")}
                    </Text>
                    {updateInfo?.prerelease ? (
                      <Text selectable={false} className="text-xs font-semibold text-accent">
                        {t("updates.previewRelease")}
                      </Text>
                    ) : null}
                  </View>
                  <Accordion.Indicator />
                </Accordion.Trigger>
                <Accordion.Content>
                  <ReleaseNotesMarkdown
                    markdown={updateInfo?.body?.trim() || t("updates.noReleaseNotes")}
                    selectable={false}
                  />
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
