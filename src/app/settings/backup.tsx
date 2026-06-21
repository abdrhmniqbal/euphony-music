import * as DocumentPicker from "expo-document-picker"
import { Directory } from "expo-file-system"
import * as Sharing from "expo-sharing"
import { Button, Dialog, ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { useState } from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { backupPreferencesToFile, restorePreferencesFromFile } from "@/modules/settings/backup"
import { setAutoBackupConfig } from "@/modules/settings/auto-backup"
import { useSettingsStore } from "@/modules/settings/store"
import { showAppToast } from "@/modules/ui/toast"

function getFolderNameFromPath(path: string) {
  try {
    const decoded = decodeURIComponent(path)
    const normalized = decoded.replace(/\/$/, "")
    const parts = normalized.split("/")
    const last = parts[parts.length - 1]
    return last || path
  } catch {
    return path
  }
}

export default function BackupSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)

  const config = useSettingsStore((state) => state.autoBackupConfig)

  async function handleBackup() {
    try {
      const uri = await backupPreferencesToFile(config.targetDirectoryUri)
      if (!config.targetDirectoryUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { UTI: "public.json", mimeType: "application/json" })
      } else {
        showAppToast(t("settings.backup.backup"), "Backup saved to folder.")
      }
      await setAutoBackupConfig({ lastBackupAt: Date.now() })
      setIsBackupDialogOpen(false)
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

      const success = await restorePreferencesFromFile(result.assets[0].uri)
      if (success) {
        showAppToast(t("settings.backup.restoreSuccessful"), t("settings.backup.restoreSuccessfulDescription"))
      } else {
        showAppToast(t("settings.backup.restoreFailed"), t("settings.backup.restoreFailedDescription"))
      }
      setIsRestoreDialogOpen(false)
    } catch {
      showAppToast(t("settings.backup.restoreFailed"), t("settings.advanced.tryAgainDescription"))
    }
  }

  async function handleTargetFolderPick() {
    try {
      const result = await Directory.pickDirectoryAsync()
      if (!result?.uri) return
      await setAutoBackupConfig({ targetDirectoryUri: result.uri })
    } catch {
      // User cancelled
    }
  }

  const folderDescription = React.useMemo(() => {
    if (!config.targetDirectoryUri) return t("settings.autoBackup.folderUnset")
    return getFolderNameFromPath(config.targetDirectoryUri)
  }, [config.targetDirectoryUri, t])

  const lastBackupDescription = React.useMemo(() => {
    if (!config.lastBackupAt) return t("settings.autoBackup.disabledDescription")
    try {
      const date = new Date(config.lastBackupAt)
      return `Last backup: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } catch {
      return t("settings.autoBackup.disabledDescription")
    }
  }, [config.lastBackupAt, t])

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5 px-4 py-4">
          <ListGroup>
            <ListGroup.Item onPress={handleTargetFolderPick}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.autoBackup.targetFolder")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {folderDescription}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>

          <ListGroup>
            <ListGroup.Item onPress={() => setIsBackupDialogOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.backup.backup")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{t("settings.backup.backupDescription")}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => setIsRestoreDialogOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.backup.restore")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{t("settings.backup.restoreDescription")}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>

          <ListGroup>
            <ListGroup.Item onPress={() => router.push("/settings/auto-backup")}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.autoBackup.title")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {config.enabled ? `${t("settings.autoBackup.enabledDescription")} · ${lastBackupDescription}` : lastBackupDescription}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>
        </View>
      </ScrollView>

      <Dialog isOpen={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.backup.backup")}</Dialog.Title>
              <Dialog.Description>{t("settings.backup.backupDialogDescription")}</Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsBackupDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={handleBackup}>{t("settings.backup.backup")}</Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>{t("settings.backup.restore")}</Dialog.Title>
              <Dialog.Description>{t("settings.backup.restoreDialogDescription")}</Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsRestoreDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={handleRestore}>{t("settings.backup.restore")}</Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
