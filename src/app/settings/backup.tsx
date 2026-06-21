import * as DocumentPicker from "expo-document-picker"
import * as Sharing from "expo-sharing"
import { Button, Dialog, ListGroup, Separator } from "heroui-native"
import { useState } from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { backupPreferencesToFile, restorePreferencesFromFile } from "@/modules/settings/backup"
import { showAppToast } from "@/modules/ui/toast"

export default function BackupSettingsScreen() {
  const { t } = useTranslation()
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)

  async function handleBackup() {
    try {
      const uri = await backupPreferencesToFile()
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: "public.json", mimeType: "application/json" })
      }
      setIsBackupDialogOpen(false)
    } catch {
      showAppToast("Backup Failed", t("settings.advanced.tryAgainDescription"))
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
        showAppToast("Restore Successful", "Preferences restored.")
      } else {
        showAppToast("Restore Failed", "Invalid backup file.")
      }
      setIsRestoreDialogOpen(false)
    } catch {
      showAppToast("Restore Failed", t("settings.advanced.tryAgainDescription"))
    }
  }

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5 px-4 py-4">
          <ListGroup>
            <ListGroup.Item onPress={() => setIsBackupDialogOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Backup Preferences</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>Export settings and preferences to file.</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => setIsRestoreDialogOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Restore Preferences</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>Import settings from backup file.</ListGroup.ItemDescription>
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
              <Dialog.Title>Backup Preferences</Dialog.Title>
              <Dialog.Description>
                Export all your settings and preferences to a file.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsBackupDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={handleBackup}>
                Backup
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog isOpen={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>Restore Preferences</Dialog.Title>
              <Dialog.Description>
                Import settings from a backup file. This will override current preferences.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setIsRestoreDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onPress={handleRestore}>
                Restore
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
