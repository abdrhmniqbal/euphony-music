import { useQuery } from "@tanstack/react-query"
import { Separator } from "heroui-native"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ReleaseNotesMarkdown } from "@/domains/updates/ui/release-notes-markdown"
import {
  getChangelogReleaseNotesUntilCurrent,
  getCurrentAppVersion,
} from "@/domains/updates/app-update-service"

export function WhatsNewSettings() {
  const { t } = useTranslation()
  const currentVersion = getCurrentAppVersion()
  const releaseNotesQuery = useQuery({
    queryKey: ["app-update-release-notes", currentVersion],
    queryFn: () => getChangelogReleaseNotesUntilCurrent({ currentVersion }),
  })

  const releaseNotes = releaseNotesQuery.data ?? []

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="gap-1">
          <Text className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("settings.about.whatsNew")}
          </Text>
          <Text className="text-2xl font-semibold leading-8 text-foreground">
            v{currentVersion || t("common.unknown")}
          </Text>
          <Text className="text-sm leading-5 text-muted">
            {t("settings.about.whatsNewCurrentVersion", {
              version: currentVersion || t("common.unknown"),
            })}
          </Text>
        </View>

        {releaseNotesQuery.isPending ? (
          <Text className="text-sm text-muted">{t("settings.about.whatsNewLoading")}</Text>
        ) : null}

        {!releaseNotesQuery.isPending && releaseNotes.length === 0 ? (
          <Text className="text-sm text-muted">{t("settings.about.whatsNewEmpty")}</Text>
        ) : null}

        {releaseNotes.map((release, index) => (
          <View key={release.version} className="gap-3 pt-2">
            {index > 0 && <Separator className="my-2" />}
            <View className="gap-2">
              <View className="flex-row items-start gap-3">
                <Text className="flex-1 text-xl font-semibold leading-7 text-foreground">
                  {release.releaseName}
                </Text>
                <Text className="rounded-full bg-default px-3 py-1 text-xs font-medium text-muted">
                  {release.version}
                </Text>
              </View>
              {release.prerelease ? (
                <Text className="text-xs font-semibold text-accent">
                  {t("updates.previewRelease")}
                </Text>
              ) : null}
            </View>
            <ReleaseNotesMarkdown markdown={release.body} selectable={false} />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
