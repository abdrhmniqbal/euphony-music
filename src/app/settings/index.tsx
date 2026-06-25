/**
 * Purpose: Renders the settings hub with grouped routes for app preferences, system options, and settings search.
 * Caller: Settings root route.
 * Dependencies: Expo Router, react-i18next, settings route/search definitions, HeroUI Native ListGroup/Input.
 * Main Functions: SettingsScreen()
 * Side Effects: Navigates to settings detail routes.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { Input, PressableFeedback } from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import LocalSearch01Icon from "@/components/icons/local/search-01"
import { useThemeColors } from "@/modules/ui/theme"

import { SETTINGS_CATEGORY_ROUTES } from "@/modules/settings/routes"
import { SETTINGS_SEARCH_ENTRIES } from "@/modules/settings/search-index"
import {
  SettingsListGroup,
  SettingsNavigationRow,
  SettingsScrollView,
} from "@/components/blocks/settings"

function normalizeSearchText(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim()
}

export default function SettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const theme = useThemeColors()
  const [query, setQuery] = React.useState("")
  const normalizedQuery = normalizeSearchText(query)

  const searchResults = React.useMemo(() => {
    if (!normalizedQuery) {
      return []
    }

    return SETTINGS_SEARCH_ENTRIES.map((entry) => {
      const title = t(entry.titleKey)
      const description = entry.descriptionKey ? t(entry.descriptionKey) : ""
      const section = entry.sectionKey ? t(entry.sectionKey) : ""
      const haystack = normalizeSearchText(`${title} ${description} ${section}`)

      return {
        ...entry,
        title,
        description,
        section,
        haystack,
      }
    })
      .filter((entry) => entry.haystack.includes(normalizedQuery))
      .slice(0, 30)
  }, [normalizedQuery, t])

  function openSearchResult(route: string, highlight?: string) {
    if (highlight) {
      router.push(`${route}?highlight=${encodeURIComponent(highlight)}`)
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
            <LocalSearch01Icon fill="none" width={24} height={24} color={theme.foreground} />
          </View>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t("settings.search.placeholder", "Search settings")}
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
              <LocalCancel01Icon fill="none" width={18} height={18} color={theme.muted} />
            </PressableFeedback>
          )}
        </View>
        {isSearching ? (
          <Text className="px-1 text-xs text-muted">
            {searchResults.length > 0
              ? t("settings.search.resultCount", "{{count}} matching settings", {
                  count: searchResults.length,
                })
              : t("settings.search.noResults", "No settings found")}
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
          {SETTINGS_CATEGORY_ROUTES.map((route) => (
            <SettingsNavigationRow
              key={route.name}
              title={t(route.titleKey)}
              description={route.descriptionKey ? t(route.descriptionKey) : null}
              onPress={() => router.push(`/settings/${route.name}`)}
            />
          ))}
        </SettingsListGroup>
      )}
    </SettingsScrollView>
  )
}
