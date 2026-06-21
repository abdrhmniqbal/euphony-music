/**
 * Purpose: Renders folder whitelist and blacklist controls for shaping indexed library content.
 * Caller: Settings folder-filters route.
 * Dependencies: Expo directory picker, HeroUI Native Card, ListGroup, Separator, buttons and bottom sheet, react-i18next, settings store, indexer service, theme colors.
 * Main Functions: FolderFiltersScreen()
 * Side Effects: Persists folder filter configuration and can trigger library reindexing.
 */

import { Button, Card, ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import LocalAddIcon from "@/components/icons/local/add"
import LocalCancelIcon from "@/components/icons/local/cancel"
import LocalFolderSolidIcon from "@/components/icons/local/folder-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { startIndexing } from "@/modules/indexer/service"
import { useIndexerStore } from "@/modules/indexer/store"
import { usePlayerTracks } from "@/modules/player/selectors"
import {
  commitFolderFilterConfig,
  type FolderFilterConfig,
  type FolderFilterMode,
  getFolderNameFromPath,
  getFolderPathFromUri,
  normalizeFolderPath,
} from "@/modules/settings/folder-filters"
import { useSettingsStore } from "@/modules/settings/store"
import { showAppToast } from "@/modules/ui/toast"
import { useThemeColors } from "@/modules/ui/theme"

interface FolderEntry {
  path: string
  name: string
  trackCount: number
}

function buildFolderEntries(trackUris: Array<{ uri?: string | null }>): FolderEntry[] {
  const folderMap = new Map<string, FolderEntry>()

  for (const track of trackUris) {
    const uri = track.uri || ""
    const folderPath = getFolderPathFromUri(uri)
    if (!folderPath) {
      continue
    }

    const existing = folderMap.get(folderPath)
    if (existing) {
      existing.trackCount += 1
      continue
    }

    folderMap.set(folderPath, {
      path: folderPath,
      name: getFolderNameFromPath(folderPath),
      trackCount: 1,
    })
  }

  return Array.from(folderMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  )
}

interface FolderRowProps {
  path: string
  allFolders: FolderEntry[]
  removeIconColor: string
  isLast?: boolean
  isDisabled?: boolean
  onRemove: (path: string) => void
}

function FolderRow({
  path,
  allFolders,
  removeIconColor,
  isLast = false,
  isDisabled = false,
  onRemove,
}: FolderRowProps) {
  const folder = allFolders.find((entry) => entry.path === path)
  const displayName = folder?.name || getFolderNameFromPath(path)
  const trackCount = folder?.trackCount ?? 0

  return (
    <>
      <ListGroup.Item disabled={isDisabled}>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{displayName}</ListGroup.ItemTitle>
          <ListGroup.ItemDescription numberOfLines={2}>{path}</ListGroup.ItemDescription>
          {trackCount > 0 ? (
            <ListGroup.ItemDescription>
              {trackCount} {trackCount === 1 ? "track" : "tracks"}
            </ListGroup.ItemDescription>
          ) : null}
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <Button
            variant="ghost"
            onPress={() => onRemove(path)}
            isDisabled={isDisabled}
            hitSlop={8}
            isIconOnly
          >
            <LocalCancelIcon fill="none" width={18} height={18} color={removeIconColor} />
          </Button>
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
      {!isLast && <Separator className="mx-4" />}
    </>
  )
}

const EMPTY_PENDING: FolderFilterConfig = { whitelist: [], blacklist: [] }

function sanitizeFolderFilterConfig(
  config: FolderFilterConfig | null | undefined
): FolderFilterConfig {
  return {
    whitelist: Array.isArray(config?.whitelist) ? config.whitelist : [],
    blacklist: Array.isArray(config?.blacklist) ? config.blacklist : [],
  }
}

function getModeFromConfig(config: FolderFilterConfig): FolderFilterMode {
  if (config.whitelist.length > 0) {
    return "whitelist"
  }

  if (config.blacklist.length > 0) {
    return "blacklist"
  }

  return "whitelist"
}

export default function FolderFiltersScreen() {
  const insets = useSafeAreaInsets()
  const theme = useThemeColors()
  const { t } = useTranslation()
  const tracks = usePlayerTracks()
  const folderFilterConfig = sanitizeFolderFilterConfig(
    useSettingsStore((state) => state.folderFilterConfig)
  )
  const isIndexing = useIndexerStore((state) => state.indexerState.isIndexing)
  const [pendingConfig, setPendingConfig] = React.useState<FolderFilterConfig>(folderFilterConfig)
  const [selectedMode, setSelectedMode] = React.useState<FolderFilterMode>(() =>
    getModeFromConfig(folderFilterConfig)
  )
  const [hasPendingChanges, setHasPendingChanges] = React.useState(false)

  const allFolders = buildFolderEntries(tracks)
  const folderPaths = Array.from(
    new Set([...pendingConfig.whitelist, ...pendingConfig.blacklist])
  ).sort((a, b) =>
    getFolderNameFromPath(a).localeCompare(getFolderNameFromPath(b), undefined, {
      sensitivity: "base",
    })
  )
  const hasAnyFilters = folderPaths.length > 0

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
      setHasPendingChanges(true)
      showAppToast(t("settings.library.addNewFolder"), t("common.feedback.folderAdded"))
    } catch {
      // User cancelled picker.
    }
  }

  function removeFolder(path: string) {
    setPendingConfig((prev) => ({
      whitelist: prev.whitelist.filter((p) => p !== path),
      blacklist: prev.blacklist.filter((p) => p !== path),
    }))
    setHasPendingChanges(true)
  }

  function clearAllFolders() {
    setPendingConfig(EMPTY_PENDING)
    setHasPendingChanges(true)
  }

  function setUnifiedMode(mode: FolderFilterMode) {
    if (mode === selectedMode) {
      return
    }

    setSelectedMode(mode)
    if (!hasAnyFilters) {
      return
    }

    setPendingConfig((prev) => {
      const folders = Array.from(new Set([...prev.whitelist, ...prev.blacklist]))
      return mode === "whitelist"
        ? { whitelist: folders, blacklist: [] }
        : { whitelist: [], blacklist: folders }
    })
    setHasPendingChanges(true)
  }

  function toggleMode() {
    setUnifiedMode(selectedMode === "whitelist" ? "blacklist" : "whitelist")
  }

  async function applyFilter() {
    if (!hasPendingChanges) {
      return
    }

    await commitFolderFilterConfig(pendingConfig)
    showAppToast(
      t("settings.routes.folderFilters.title"),
      t("common.feedback.folderFiltersApplied")
    )
    await startIndexing(false, true)
    setHasPendingChanges(false)
  }

  function getModeLabel() {
    if (selectedMode === "whitelist") {
      return t("settings.library.whitelist")
    }
    if (selectedMode === "blacklist") {
      return t("settings.library.blacklist")
    }
    return t("settings.library.whitelist")
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 112 + insets.bottom,
          paddingHorizontal: 16,
          paddingTop: 16,
        }}
      >
        <Card className="mb-6">
          <Card.Body>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-4 pb-2">
                <Card.Title className="text-lg">{t("settings.library.filterMode")}</Card.Title>
                <Card.Description className="text-sm leading-5">
                  {t("settings.library.filterModeDescription")}
                </Card.Description>
              </View>
              <Button
                variant="secondary"
                onPress={toggleMode}
                isDisabled={isIndexing}
              >
                {getModeLabel()}
              </Button>
            </View>
          </Card.Body>
          <Card.Footer>
            <Button
              onPress={() => {
                void pickFolder()
              }}
              variant="secondary"
              isDisabled={isIndexing}
              className="flex-1"
            >
              <LocalAddIcon fill="none" width={24} height={24} color={theme.accent} />
              <Button.Label>{t("settings.library.addNewFolder")}</Button.Label>
            </Button>
          </Card.Footer>
        </Card>

        <View className="mb-3 flex-row items-center justify-between px-1">
          <Text className="text-[22px] font-semibold tracking-[-0.5px] text-foreground">
            {t("settings.library.folders")}
          </Text>
          <Button
            variant="ghost"
            onPress={clearAllFolders}
            isDisabled={!hasAnyFilters || isIndexing}
          >
            {t("common.clearAll")}
          </Button>
        </View>

        {folderPaths.length === 0 ? (
          <EmptyState
            icon={<LocalFolderSolidIcon fill="none" width={40} height={40} color={theme.muted} />}
            title={t("settings.library.noFoldersAdded")}
            message={t("settings.library.noFoldersAddedMessage")}
            className="mt-4"
          />
        ) : (
          <ListGroup>
            {folderPaths.map((path, index) => (
              <FolderRow
                key={path}
                path={path}
                allFolders={allFolders}
                removeIconColor={theme.muted}
                isLast={index === folderPaths.length - 1}
                onRemove={removeFolder}
                isDisabled={isIndexing}
              />
            ))}
          </ListGroup>
        )}
      </ScrollView>

      <View
        className="absolute right-0 bottom-0 left-0 border-t border-border bg-background px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <Button
          onPress={() => {
            void applyFilter()
          }}
          isDisabled={!hasPendingChanges || isIndexing}
          className="rounded-[22px]"
        >
          {isIndexing ? t("settings.library.indexing") : t("settings.library.applyFilter")}
        </Button>
      </View>

    </View>
  )
}
