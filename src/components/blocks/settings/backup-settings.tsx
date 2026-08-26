import * as DocumentPicker from "expo-document-picker"
import { BottomSheet, Button, Checkbox, Dialog, ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import * as Sharing from "expo-sharing"
import { useTranslation } from "react-i18next"

import {
  SettingsListGroup,
  SettingsNavigationRow,
  SettingsScrollView,
} from "@/components/blocks/settings/ui"
import { showAppToast } from "@/core/ui/toast"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import { useGuardedRouter } from "@/core/navigation"
import { backupToFile, parseBackupFile, restoreFromBackup } from "@/domains/backup/backup"
import { queryClient } from "@/core/query/query-client"
import { HISTORY_RECENTLY_PLAYED_KEY, HISTORY_TOP_TRACKS_KEY } from "@/domains/library/query-keys"

// Android directory picks return SAF tree URIs like
// content://.../tree/primary%3AMusic%2FBackups — decode and take the last segment.
export function BackupSettings() {
  const router = useGuardedRouter()
  const { t } = useTranslation()
  const config = usePreferenceStore((state) => state.autoBackupConfig)
  const [isBackupSheetOpen, setIsBackupSheetOpen] = React.useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = React.useState(false)
  const [includePreferences, setIncludePreferences] = React.useState(true)
  const [includeHistory, setIncludeHistory] = React.useState(true)

  function updateAutoBackupConfig(updates: Partial<typeof config>) {
    const current = preferenceStore.getState().autoBackupConfig
    preferenceStore.setState({ autoBackupConfig: { ...current, ...updates } })
  }

  async function handleBackup() {
    try {
      const uri = await backupToFile(config.targetDirectoryUri, {
        includePreferences,
        includeHistory,
      })
      if (!config.targetDirectoryUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { UTI: "public.json", mimeType: "application/json" })
      } else {
        showAppToast(t("settings.backup.backup"), t("settings.backup.backupSavedToFolder"))
      }
      updateAutoBackupConfig({ lastBackupAt: Date.now() })
      setIsBackupSheetOpen(false)
    } catch {
      showAppToast(t("settings.backup.backupFailed"), t("settings.advanced.tryAgainDescription"))
    }
  }

  async function handleRestore() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets[0]?.uri) return

      const data = await parseBackupFile(result.assets[0].uri)
      if (data) {
        await restoreFromBackup(data)
        await queryClient.invalidateQueries({ queryKey: [HISTORY_RECENTLY_PLAYED_KEY] })
        await queryClient.invalidateQueries({ queryKey: [HISTORY_TOP_TRACKS_KEY] })
        showAppToast(
          t("settings.backup.restoreSuccessful"),
          t("settings.backup.restoreSuccessfulDescription")
        )
      } else {
        showAppToast(
          t("settings.backup.restoreFailed"),
          t("settings.backup.restoreFailedDescription")
        )
      }
      setIsRestoreDialogOpen(false)
    } catch {
      showAppToast(t("settings.backup.restoreFailed"), t("settings.advanced.tryAgainDescription"))
    }
  }

  async function handleTargetFolderPick() {
    try {
      const { Directory } = await import("expo-file-system")
      const result = await Directory.pickDirectoryAsync()
      if (!result?.uri) return
      updateAutoBackupConfig({ targetDirectoryUri: result.uri })
    } catch {
      // User cancelled
    }
  }

  const lastBackupDescription = !config.lastBackupAt
    ? t("settings.autoBackup.neverRun")
    : (() => {
        try {
          const date = new Date(config.lastBackupAt)
          return `${t("settings.autoBackup.lastBackup")}: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        } catch {
          return t("settings.autoBackup.neverRun")
        }
      })()

  return (
    <>
      <SettingsScrollView>
        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.backup.sections.storage")}
          </Text>
          <SettingsListGroup>
            <SettingsNavigationRow
              title={t("settings.autoBackup.targetFolder")}
              description={
                config.targetDirectoryUri
                  ? decodeURIComponent(config.targetDirectoryUri)
                  : t("settings.autoBackup.folderUnset")
              }
              onPress={() => void handleTargetFolderPick()}
            />
          </SettingsListGroup>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.backup.sections.manual")}
          </Text>
          <SettingsListGroup>
            <SettingsNavigationRow
              title={t("settings.backup.backup")}
              description={t("settings.backup.backupDescription")}
              onPress={() => setIsBackupSheetOpen(true)}
            />
            <SettingsNavigationRow
              title={t("settings.backup.restore")}
              description={t("settings.backup.restoreDescription")}
              onPress={() => setIsRestoreDialogOpen(true)}
            />
          </SettingsListGroup>
        </View>

        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase text-muted">
            {t("settings.backup.sections.automatic")}
          </Text>
          <SettingsListGroup>
            <SettingsNavigationRow
              title={t("settings.autoBackup.title")}
              description={
                config.enabled
                  ? `${t("settings.autoBackup.enabledDescription")} · ${lastBackupDescription}`
                  : lastBackupDescription
              }
              onPress={() => router.push("/settings/auto-backup")}
            />
          </SettingsListGroup>
        </View>
      </SettingsScrollView>

      <BottomSheet isOpen={isBackupSheetOpen} onOpenChange={setIsBackupSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            backgroundClassName="bg-surface"
            enableDynamicSizing
            keyboardBehavior="interactive"
          >
            <View className="gap-1.5 pb-2">
              <BottomSheet.Title className="text-xl">
                {t("settings.backup.backup")}
              </BottomSheet.Title>
              <Text className="text-sm text-muted">
                {t("settings.backup.backupDialogDescription")}
              </Text>
            </View>
            <ListGroup className="mb-4">
              <ListGroup.Item>
                <Checkbox
                  isSelected={includePreferences}
                  onSelectedChange={setIncludePreferences}
                />
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>
                    {t("settings.backup.includePreferences")}
                  </ListGroup.ItemTitle>
                </ListGroup.ItemContent>
              </ListGroup.Item>
              <Separator className="mx-4" />
              <ListGroup.Item>
                <Checkbox isSelected={includeHistory} onSelectedChange={setIncludeHistory} />
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t("settings.backup.includeHistory")}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </ListGroup>
            <Button
              className="mb-8"
              isDisabled={!includePreferences && !includeHistory}
              onPress={() => void handleBackup()}
            >
              {t("settings.backup.backup")}
            </Button>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <Dialog isOpen={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay isCloseOnPress />
          <Dialog.Content className="gap-4" isSwipeable>
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.backup.restore")}</Dialog.Title>
              <Dialog.Description>
                {t("settings.backup.restoreDialogDescription")}
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsRestoreDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={() => void handleRestore()}>{t("settings.backup.restore")}</Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
