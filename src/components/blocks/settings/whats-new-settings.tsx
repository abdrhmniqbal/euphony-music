import { useQuery } from "@tanstack/react-query"
import { Accordion } from "heroui-native"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { ReleaseNotesMarkdown } from "@/domains/updates/ui/release-notes-markdown"
import {
  getGitHubReleaseNotesUntilCurrent,
  getCurrentAppVersion,
} from "@/domains/updates/app-update-service"

export function WhatsNewSettings() {
  const { t } = useTranslation()
  const currentVersion = getCurrentAppVersion()
  const releaseNotesQuery = useQuery({
    queryKey: ["app-update-release-notes", currentVersion],
    queryFn: () => getGitHubReleaseNotesUntilCurrent({ currentVersion }),
  })

  const releaseNotes = releaseNotesQuery.data ?? []

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-3 px-4 py-4">
        {releaseNotesQuery.isPending ? (
          <Text className="text-sm text-muted">{t("settings.about.whatsNewLoading")}</Text>
        ) : null}

        {!releaseNotesQuery.isPending && releaseNotes.length === 0 ? (
          <Text className="text-sm text-muted">{t("settings.about.whatsNewEmpty")}</Text>
        ) : null}

        {releaseNotes.length > 0 ? (
          <Accordion
            selectionMode="multiple"
            defaultValue={releaseNotes[0]?.version ? [releaseNotes[0].version] : []}
            variant="surface"
          >
            {releaseNotes.map((release) => (
              <Accordion.Item key={release.version} value={release.version}>
                <Accordion.Trigger>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="shrink text-base font-semibold text-foreground">
                        {release.releaseName}
                      </Text>
                      {release.prerelease ? (
                        <Text className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                          {t("updates.previewRelease")}
                        </Text>
                      ) : null}
                    </View>
                    <Text className="text-xs font-medium text-muted">
                      {release.publishedAt
                        ? new Date(release.publishedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : `v${release.version}`}
                    </Text>
                  </View>
                  <Accordion.Indicator />
                </Accordion.Trigger>
                <Accordion.Content>
                  <ReleaseNotesMarkdown markdown={release.body} selectable={false} />
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion>
        ) : null}
      </View>
    </ScrollView>
  )
}
