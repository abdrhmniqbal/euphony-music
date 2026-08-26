import { Button, Card, ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalAdd01Icon from "@/components/icons/local/add-01"
import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import LocalFolder01SolidIcon from "@/components/icons/local/folder-01-solid"
import { EmptyState } from "@/components/ui/empty-state"
import { getFolderNameFromPath } from "@/domains/indexer/scan/folder-filter"

export type FolderFilterMode = "whitelist" | "blacklist"

interface FolderFilterStepProps {
  activeFolders: string[]
  selectedMode: FolderFilterMode
  foregroundColor: string
  mutedColor: string
  onSetMode: (mode: FolderFilterMode) => void
  onPickFolder: () => void
  onRemoveFolder: (path: string) => void
}

export function FolderFilterStep({
  activeFolders,
  selectedMode,
  foregroundColor,
  mutedColor,
  onSetMode,
  onPickFolder,
  onRemoveFolder,
}: FolderFilterStepProps) {
  const { t } = useTranslation()

  return (
    <View className="gap-5">
      <Card>
        <Card.Body>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4 pb-2">
              <Card.Title className="text-lg">{t("settings.library.filterMode")}</Card.Title>
              <Card.Description className="text-sm leading-5">
                {t("settings.library.filterModeDescription")}
              </Card.Description>
            </View>
            <View className="flex-row items-center gap-1">
              <Button
                variant="secondary"
                onPress={() => onSetMode(selectedMode === "whitelist" ? "blacklist" : "whitelist")}
              >
                {selectedMode === "whitelist"
                  ? t("settings.library.whitelist")
                  : t("settings.library.blacklist")}
              </Button>
            </View>
          </View>
        </Card.Body>
      </Card>

      <View className="flex-row items-center justify-between px-1">
        <Text className="text-[22px] font-semibold tracking-[-0.5px] text-foreground">
          {t("settings.library.folders")}
        </Text>
        <Button variant="ghost" onPress={onPickFolder}>
          <View className="flex-row items-center gap-2">
            <LocalAdd01Icon fill="none" width={18} height={18} color={foregroundColor} />
            <Text className="font-semibold text-foreground">
              {t("settings.library.addNewFolder")}
            </Text>
          </View>
        </Button>
      </View>

      {activeFolders.length === 0 ? (
        <EmptyState
          icon={<LocalFolder01SolidIcon fill="none" width={40} height={40} color={mutedColor} />}
          title={t("settings.library.noFoldersAdded")}
          message={t("settings.library.noFoldersAddedMessage")}
          className="mt-1"
        />
      ) : (
        <ListGroup>
          {activeFolders.map((path, index) => (
            <React.Fragment key={path}>
              <ListGroup.Item>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{getFolderNameFromPath(path)}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription numberOfLines={2}>{path}</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <Button
                    variant="ghost"
                    onPress={() => onRemoveFolder(path)}
                    isIconOnly
                    hitSlop={8}
                  >
                    <LocalCancel01Icon fill="none" width={18} height={18} color={mutedColor} />
                  </Button>
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
              {index < activeFolders.length - 1 ? <Separator className="mx-4" /> : null}
            </React.Fragment>
          ))}
        </ListGroup>
      )}
    </View>
  )
}
