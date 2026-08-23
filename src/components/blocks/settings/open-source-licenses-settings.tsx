import { BottomSheet, Button, ListGroup } from "heroui-native"
import { BottomSheetScrollView } from "@gorhom/bottom-sheet"
import * as React from "react"
import { Linking, ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import licenses from "@/assets/open-source-licenses.json"

interface OpenSourceLicenseItem {
  name: string
  version: string
  repository: string
  licenses: string
  licenseText: string
}

export function OpenSourceLicensesSettings() {
  const { t } = useTranslation()
  const entries = licenses as OpenSourceLicenseItem[]
  const [selectedEntry, setSelectedEntry] = React.useState<OpenSourceLicenseItem | null>(null)
  const snapPoints = React.useMemo(() => ["72%", "92%"], [])
  const isSheetOpen = selectedEntry !== null

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-4 px-4 py-4">
          <Text className="text-sm text-muted">
            {t("settings.about.openSourceLicensesDescription")}
          </Text>

          {entries.length === 0 ? (
            <Text className="text-sm text-muted">{t("settings.about.openSourceLicensesEmpty")}</Text>
          ) : (
            <ListGroup>
              {entries.map((entry) => (
                <ListGroup.Item
                  key={`${entry.name}@${entry.version}`}
                  onPress={() => {
                    setSelectedEntry(entry)
                  }}
                >
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>{entry.name}</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>
                      v{entry.version} · {entry.licenses || t("common.unknown")}
                    </ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                  <ListGroup.ItemSuffix />
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </View>
      </ScrollView>

      <BottomSheet
        isOpen={isSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntry(null)
          }
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay isCloseOnPress />
          <BottomSheet.Content
            snapPoints={snapPoints}
            enableOverDrag={false}
            enableDynamicSizing={false}
            contentContainerClassName="h-full px-0"
            className="gap-2"
            backgroundClassName="bg-surface"
          >
            <BottomSheetScrollView
              contentContainerClassName="px-4 pb-safe-offset-16"
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-5 pb-4">
                <View className="gap-2">
                  <Text className="text-2xl font-semibold leading-8 text-foreground">
                    {selectedEntry?.name || t("common.unknown")}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    <View className="rounded-full bg-background px-3 py-1.5">
                      <Text className="text-xs font-medium text-muted">
                        v{selectedEntry?.version || t("common.unknown")}
                      </Text>
                    </View>
                    <View className="rounded-full bg-background px-3 py-1.5">
                      <Text className="text-xs font-medium text-muted">
                        {selectedEntry?.licenses || t("common.unknown")}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedEntry?.repository ? (
                  <View className="gap-2">
                    <Text className="px-1 text-xs font-semibold uppercase text-muted">
                      {t("settings.about.licenseRepository")}
                    </Text>
                    <Button
                      onPress={() => {
                        void Linking.openURL(selectedEntry.repository)
                      }}
                    >
                      {t("settings.about.viewRepository")}
                    </Button>
                    <Text className="px-1 text-xs leading-5 text-muted" numberOfLines={2}>
                      {selectedEntry.repository}
                    </Text>
                  </View>
                ) : null}

                <View className="gap-2">
                  <Text className="px-1 text-xs font-semibold uppercase text-muted">
                    {t("settings.about.licenseText")}
                  </Text>
                  <View className="rounded-2xl bg-background p-4">
                    {selectedEntry?.licenseText ? (
                      <Text className="text-xs leading-5 text-foreground">
                        {selectedEntry.licenseText}
                      </Text>
                    ) : (
                      <Text className="text-xs leading-5 text-muted">
                        {t("settings.about.licenseTextUnavailable")}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </BottomSheetScrollView>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  )
}
