import { Input, PressableFeedback } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalCancelCircleSolidIcon from "@/components/icons/local/cancel-circle-solid"
import LocalSearch01Icon from "@/components/icons/local/search-01"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { useGuardedRouter } from "@/core/navigation"
import {
  SETTINGS_CATEGORY_ROUTES,
  SETTINGS_SEARCH_ENTRIES,
} from "@/domains/settings/routes"
import {
  SettingsListGroup,
  SettingsNavigationRow,
  SettingsScrollView,
} from "@/components/blocks/settings/ui"

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim()
}

export function SettingsHub() {
  const router = useGuardedRouter()
  const { t } = useTranslation()
  const theme = useThemeColors()
  const [query, setQuery] = React.useState("")
  const normalizedQuery = normalizeSearchText(query)

  const searchResults = React.useMemo(() => {
    if (!normalizedQuery) {
      return []
    }

    return SETTINGS_SEARCH_ENTRIES.map((entry) => ({
      ...entry,
      title: t(entry.titleKey),
      description: entry.descriptionKey ? t(entry.descriptionKey) : "",
      section: entry.sectionKey ? t(entry.sectionKey) : "",
    }))
      .filter((entry) =>
        normalizeSearchText(`${entry.title} ${entry.description} ${entry.section}`).includes(
          normalizedQuery
        )
      )
      .slice(0, 30)
  }, [normalizedQuery, t])

  function openSearchResult(route: string, highlight?: string) {
    if (highlight) {
      router.push({ pathname: route, params: { highlight } })
      return
    }

    router.push(route)
  }

  const isSearching = normalizedQuery.length > 0

  return (
    <SettingsScrollView keyboardShouldPersistTaps="handled">
      <View className="gap-2">
        <View className="relative">
          <View
            pointerEvents="none"
            className="absolute inset-y-0 left-1 z-20 w-10 items-center justify-center"
          >
            <LocalSearch01Icon fill="none" width={24} height={24} color={theme.muted} />
          </View>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t("settings.search.placeholder")}
            placeholderTextColor={theme.muted}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={theme.accent}
            className="pl-12 pr-10"
          />
          {query.length > 0 && (
            <PressableFeedback
              onPress={() => setQuery("")}
              className="absolute inset-y-0 right-2.5 justify-center p-1"
            >
              <LocalCancelCircleSolidIcon
                fill="none"
                width={18}
                height={18}
                color={theme.muted}
              />
            </PressableFeedback>
          )}
        </View>
        {isSearching ? (
          <Text className="px-1 text-xs text-muted">
            {searchResults.length > 0
              ? t("settings.search.resultCount", { count: searchResults.length })
              : t("settings.search.noResults")}
          </Text>
        ) : null}
      </View>

      {isSearching ? (
        searchResults.length > 0 ? (
          <SettingsListGroup>
            {searchResults.map((entry) => (
              <SettingsNavigationRow
                key={entry.id}
                title={entry.title}
                description={
                  entry.section ? `${entry.section} · ${entry.description}` : entry.description
                }
                onPress={() => openSearchResult(entry.route, entry.highlight)}
              />
            ))}
          </SettingsListGroup>
        ) : null
      ) : (
        <SettingsListGroup>
          {SETTINGS_CATEGORY_ROUTES.map((category) => (
            <SettingsNavigationRow
              key={category.name}
              title={t(category.titleKey)}
              description={category.descriptionKey ? t(category.descriptionKey) : null}
              onPress={() => router.push(category.route)}
            />
          ))}
        </SettingsListGroup>
      )}
    </SettingsScrollView>
  )
}
