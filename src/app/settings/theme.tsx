/**
 * Purpose: Renders app theme selection as a dedicated settings route.
 * Caller: Settings Appearance route -> Theme navigation.
 * Dependencies: HeroUI Native ListGroup, react-i18next, theme settings persistence, and theme registry.
 * Main Functions: ThemeSettingsScreen()
 * Side Effects: Persists selected app theme foundation for future themed variants.
 */

import { ListGroup, Separator, Input, PressableFeedback } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { useUniwind } from "uniwind"

import LocalTick02Icon from "@/components/icons/local/tick-02"
import LocalSearch01Icon from "@/components/icons/local/search-01"
import LocalCancelCircleSolidIcon from "@/components/icons/local/cancel-circle-solid"
import { setThemeConfig } from "@/modules/settings/theme"
import { useSettingsStore } from "@/modules/settings/store"
import { APP_THEMES, type AppThemeDefinition } from "@/modules/ui/theme-registry"
import { useThemeColors, STATIC_THEMES, type ThemeColors } from "@/modules/ui/theme"

function MockAppScreen({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 6, gap: 6 }}>
      {/* Top Header Mock */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View
          style={{ width: 32, height: 8, borderRadius: 4, backgroundColor: colors.foreground }}
        />
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.surface }} />
      </View>

      {/* Album Grid Row */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        <View
          style={{
            flex: 1,
            aspectRatio: 1,
            borderRadius: 6,
            backgroundColor: colors.surface,
            padding: 4,
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{ width: "80%", height: 4, borderRadius: 2, backgroundColor: colors.foreground }}
          />
        </View>
        <View
          style={{
            flex: 1,
            aspectRatio: 1,
            borderRadius: 6,
            backgroundColor: colors.surface,
            padding: 4,
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{ width: "60%", height: 4, borderRadius: 2, backgroundColor: colors.foreground }}
          />
        </View>
      </View>

      {/* Track List */}
      <View style={{ gap: 4, flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: colors.surface }}
          />
          <View style={{ gap: 2 }}>
            <View
              style={{ width: 24, height: 3, borderRadius: 2, backgroundColor: colors.foreground }}
            />
            <View
              style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: colors.muted }}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: colors.surface }}
          />
          <View style={{ gap: 2 }}>
            <View
              style={{ width: 28, height: 3, borderRadius: 2, backgroundColor: colors.foreground }}
            />
            <View
              style={{ width: 12, height: 2, borderRadius: 1, backgroundColor: colors.muted }}
            />
          </View>
        </View>
      </View>

      {/* Mini Player */}
      <View
        style={{
          height: 24,
          borderRadius: 6,
          backgroundColor: colors.surface,
          paddingHorizontal: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Progress Bar */}
        <View
          style={{
            flex: 1,
            height: 2,
            backgroundColor: colors.border,
            borderRadius: 1,
            marginRight: 6,
          }}
        >
          <View
            style={{
              width: "40%",
              height: "100%",
              backgroundColor: colors.accent,
              borderRadius: 1,
            }}
          />
        </View>
        {/* Play Button */}
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{ width: 4, height: 4, backgroundColor: colors.background, borderRadius: 1 }}
          />
        </View>
      </View>
    </View>
  )
}

function ThemePreviewSwatch({
  themeDef,
  isDarkMode,
}: {
  themeDef: AppThemeDefinition
  isDarkMode: boolean
}) {
  const previewColors = STATIC_THEMES[themeDef.id]
  const colors = previewColors
    ? isDarkMode
      ? previewColors.dark
      : previewColors.light
    : STATIC_THEMES.default.light

  return (
    <ListGroup.ItemPrefix className="mr-4 self-center">
      <View
        className="overflow-hidden rounded-2xl border border-border"
        style={{ width: 90, height: 160, borderWidth: 1 }}
      >
        <MockAppScreen colors={colors} />
      </View>
    </ListGroup.ItemPrefix>
  )
}

export default function ThemeSettingsScreen() {
  const theme = useThemeColors()
  const { theme: themeMode } = useUniwind()
  const isDarkMode = themeMode === "dark" || themeMode.endsWith("-dark")
  const { t } = useTranslation()
  const selectedThemeId = useSettingsStore((state) => state.themeConfig.themeId)

  const [query, setQuery] = React.useState("")
  const normalizedQuery = query.toLowerCase().trim()

  const filteredThemes = React.useMemo(() => {
    if (!normalizedQuery) return APP_THEMES
    return APP_THEMES.filter((appTheme) => {
      const title = t(appTheme.labelKey).toLowerCase()
      const description = t(appTheme.descriptionKey).toLowerCase()
      return title.includes(normalizedQuery) || description.includes(normalizedQuery)
    })
  }, [normalizedQuery, t])

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-5 px-4 py-4">
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
            placeholder={t("settings.appearance.theme.search.placeholder", "Search themes")}
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
              <LocalCancelCircleSolidIcon fill="none" width={18} height={18} color={theme.muted} />
            </PressableFeedback>
          )}
        </View>
        <ListGroup>
          {filteredThemes.map((appTheme, index) => (
            <React.Fragment key={appTheme.id}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item onPress={() => void setThemeConfig({ themeId: appTheme.id })}>
                <ThemePreviewSwatch themeDef={appTheme} isDarkMode={isDarkMode} />
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(appTheme.labelKey)}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {t(appTheme.descriptionKey)}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                {selectedThemeId === appTheme.id && (
                  <ListGroup.ItemSuffix>
                    <LocalTick02Icon fill="none" width={24} height={24} color={theme.accent} />
                  </ListGroup.ItemSuffix>
                )}
              </ListGroup.Item>
            </React.Fragment>
          ))}
        </ListGroup>
      </View>
    </ScrollView>
  )
}
