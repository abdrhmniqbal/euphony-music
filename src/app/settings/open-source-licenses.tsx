/**
 * Purpose: Renders generated third-party dependency licenses from bundled JSON with settings-style list and on-demand bottom sheet details.
 * Caller: About settings screen.
 * Dependencies: HeroUI Native ListGroup and BottomSheet, generated open-source-licenses asset, and react-i18next.
 * Main Functions: OpenSourceLicensesSettingsScreen()
 * Side Effects: Opens dependency repository links in external browser and controls bottom sheet visibility.
 */

import { BottomSheet, ListGroup, PressableFeedback } from "heroui-native"
import * as React from "react"
import { BottomSheetFooter, BottomSheetScrollView } from "@gorhom/bottom-sheet"
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

export default function OpenSourceLicensesSettingsScreen() {
  const { t } = useTranslation()
  const entries = licenses as OpenSourceLicenseItem[]
  const [selectedEntry, setSelectedEntry] = React.useState<OpenSourceLicenseItem | null>(null)
  const snapPoints = React.useMemo(() => ["45%", "90%"], [])
  const isSheetOpen = selectedEntry !== null

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-4 px-4 py-4">
          <Text className="text-sm text-muted">
            {t("settings.about.openSourceLicensesDescription", {
              defaultValue: "Third-party packages and license texts.",
            })}
          </Text>

          {entries.length === 0 ? (
            <Text className="text-sm text-muted">
              {t("settings.about.openSourceLicensesEmpty", {
                defaultValue: "No generated licenses yet. Run generate:licenses script.",
              })}
            </Text>
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
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={snapPoints}
            enableOverDrag={false}
            enableDynamicSizing={false}
            contentContainerClassName="h-full px-0"
            handleComponent={() => null}
            className="gap-2"
            backgroundClassName="bg-background"
          >
            <View className="flex-row items-center justify-between gap-4 px-4 pb-2">
              <BottomSheet.Title className="flex-1 text-xl font-semibold">
                {selectedEntry?.name || t("common.unknown")}
              </BottomSheet.Title>
              <BottomSheet.Close />
            </View>

            <BottomSheetScrollView
              contentContainerClassName="px-4 pb-safe-offset-16"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-sm text-muted">
                v{selectedEntry?.version || t("common.unknown")}
              </Text>
              <Text className="mt-1 text-sm text-muted">
                {selectedEntry?.licenses || t("common.unknown")}
              </Text>

              {selectedEntry?.repository ? (
                <PressableFeedback
                  onPress={() => {
                    void Linking.openURL(selectedEntry.repository)
                  }}
                  className="mt-2"
                >
                  <Text className="text-sm text-accent">{selectedEntry.repository}</Text>
                </PressableFeedback>
              ) : null}

              {selectedEntry?.licenseText ? (
                <Text className="mt-4 text-sm leading-5 text-foreground">
                  {selectedEntry.licenseText}
                </Text>
              ) : (
                <Text className="mt-4 text-xs text-muted">
                  {t("settings.about.licenseTextUnavailable", {
                    defaultValue: "License text unavailable.",
                  })}
                </Text>
              )}
            </BottomSheetScrollView>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  )
}
