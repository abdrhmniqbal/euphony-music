import { Button, useThemeColor } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { FolderFilterStep } from "@/components/blocks/onboarding/folder-filter-step"
import { showAppToast } from "@/core/ui/toast"
import { usePreferenceStore } from "@/core/preferences/store"
import { useGuardedRouter } from "@/core/navigation"
import { startIndexing } from "@/domains/indexer/service"
import { normalizePath } from "@/domains/indexer/scan/folder-filter"
import { commitFolderFilterConfig, type FolderFilterMode } from "@/domains/library/folder-filters"

export function FolderFilterSettings() {
  const router = useGuardedRouter()
  const { t } = useTranslation()
  const [accent, foreground, muted] = useThemeColor(["accent", "foreground", "muted"])
  const folderFilterConfig = usePreferenceStore((state) => state.folderFilterConfig)

  const [pendingConfig, setPendingConfig] = React.useState({
    whitelist: folderFilterConfig.whitelist,
    blacklist: folderFilterConfig.blacklist,
  })
  const [selectedMode, setSelectedMode] = React.useState<FolderFilterMode>(
    folderFilterConfig.whitelist.length > 0 ? "whitelist" : "blacklist"
  )
  const hasPendingChanges =
    pendingConfig.whitelist.join("\n") !== folderFilterConfig.whitelist.join("\n") ||
    pendingConfig.blacklist.join("\n") !== folderFilterConfig.blacklist.join("\n")

  const activeFolders =
    selectedMode === "whitelist" ? pendingConfig.whitelist : pendingConfig.blacklist

  function setUnifiedMode(mode: FolderFilterMode) {
    if (mode === selectedMode) {
      return
    }

    setSelectedMode(mode)
    if (!hasPendingChanges && activeFolders.length === 0) {
      return
    }

    setPendingConfig((prev) => {
      const folders = Array.from(new Set([...prev.whitelist, ...prev.blacklist]))
      return mode === "whitelist"
        ? { whitelist: folders, blacklist: [] }
        : { whitelist: [], blacklist: folders }
    })
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

  async function applyFilter() {
    await commitFolderFilterConfig(pendingConfig)
    showAppToast(
      t("settings.routes.folderFilters.title"),
      t("common.feedback.folderFiltersApplied")
    )
    await startIndexing(false, true)
    router.back()
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="gap-5 px-4 py-4">
          <FolderFilterStep
            activeFolders={activeFolders}
            selectedMode={selectedMode}
            foregroundColor={foreground}
            accentColor={accent}
            mutedColor={muted}
            onSetMode={setUnifiedMode}
            onPickFolder={() => void pickFolder()}
            onRemoveFolder={removeFolder}
          />
        </View>
      </ScrollView>
      <View className="border-t border-border px-4 pb-8 pt-3">
        <Button
          onPress={() => void applyFilter()}
          isDisabled={!hasPendingChanges}
          className="rounded-full"
        >
          <Button.Label>{t("settings.library.applyFilters")}</Button.Label>
        </Button>
      </View>
    </View>
  )
}
