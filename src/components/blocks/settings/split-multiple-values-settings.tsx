import { BottomSheet, Button, Chip, Input, ListGroup, Separator, TagGroup } from "heroui-native"
import * as React from "react"
import { View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalAdd01Icon from "@/components/icons/local/add-01"
import {
  SettingsScrollView,
  SettingsSwitchRow,
} from "@/components/blocks/settings/ui"
import { rebuildSplitRelationsForConfig } from "@/domains/indexer/service"
import { preferenceStore, usePreferenceStore } from "@/core/preferences/store"
import type { SplitMultipleValueConfig } from "@/core/preferences/types"
import { useThemeColors } from "@/core/theme/use-theme-colors"
import { useGuardedRouter } from "@/core/navigation"

function normalizeValues(values: string[]) {
  const seen = new Set<string>()
  const next: string[] = []
  for (const value of values) {
    const item = value.trim()
    const key = item.toLowerCase()
    if (!item || seen.has(key)) continue
    seen.add(key)
    next.push(item)
  }
  return next
}

interface TagEditorSheetContentProps {
  values: string[]
  placeholder: string
  addLabel: string
  removeLabel: string
  onChange: (values: string[]) => void
}

function TagEditorSheetContent({
  values,
  placeholder,
  addLabel,
  removeLabel,
  onChange,
}: TagEditorSheetContentProps) {
  const theme = useThemeColors()
  const [inputValue, setInputValue] = React.useState("")
  const trimmedInput = inputValue.trim()

  function addValue() {
    if (!trimmedInput) return
    const next = normalizeValues([...values, trimmedInput])
    if (next.length !== values.length) onChange(next)
    setInputValue("")
  }

  function removeValues(keys: Set<string | number>) {
    onChange(values.filter((item) => !keys.has(item)))
  }

  return (
    <>
      {values.length > 0 ? (
        <TagGroup selectionMode="none" size="md" onRemove={removeValues} className="mb-3">
          <TagGroup.List className="flex-row flex-wrap gap-2">
            {values.map((value) => (
              <TagGroup.Item key={value} id={value}>
                <TagGroup.ItemLabel>{value}</TagGroup.ItemLabel>
                <TagGroup.ItemRemoveButton accessibilityLabel={`${removeLabel} ${value}`} />
              </TagGroup.Item>
            ))}
          </TagGroup.List>
        </TagGroup>
      ) : null}
      <View className="flex-row items-center gap-2">
        <Input
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={addValue}
          placeholder={placeholder}
          className="min-h-12 flex-1"
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          accessibilityLabel={addLabel}
          variant="secondary"
          isIconOnly
          isDisabled={!trimmedInput}
          className="h-12 w-12"
          onPress={addValue}
        >
          <LocalAdd01Icon fill="none" width={22} height={22} color={theme.foreground} />
        </Button>
      </View>
    </>
  )
}

interface TagEditorSheetProps extends TagEditorSheetContentProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
}

function TagEditorSheet({ isOpen, onOpenChange, title, ...contentProps }: TagEditorSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay isCloseOnPress />
        <BottomSheet.Content
          backgroundClassName="bg-surface"
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enableBlurKeyboardOnGesture
        >
          <BottomSheet.Title className="mb-3 text-xl">{title}</BottomSheet.Title>
          <TagEditorSheetContent {...contentProps} />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}

function DelimiterChips({ values }: { values: string[] }) {
  if (values.length === 0) {
    return null
  }

  return (
    <View className="mt-1.5 flex-row flex-wrap gap-1">
      {values.map((s) => (
        <Chip key={s} variant="secondary" size="sm">
          <Chip.Label>{s}</Chip.Label>
        </Chip>
      ))}
    </View>
  )
}

export function SplitMultipleValuesSettings() {
  const { t } = useTranslation()
  const router = useGuardedRouter()
  const config = usePreferenceStore((state) => state.splitMultipleValueConfig)
  const [artistCharOpen, setArtistCharOpen] = React.useState(false)
  const [artistWordOpen, setArtistWordOpen] = React.useState(false)
  const [unsplitArtistsOpen, setUnsplitArtistsOpen] = React.useState(false)
  const [genreSymbolsOpen, setGenreSymbolsOpen] = React.useState(false)

  async function updateSplitConfig(next: Partial<SplitMultipleValueConfig>) {
    const updated = { ...config, ...next }
    preferenceStore.setState({ splitMultipleValueConfig: updated })
    await rebuildSplitRelationsForConfig(updated)
  }

  const currentModeLabel =
    config.artistSplitMode === "split"
      ? t("settings.library.artistSplitModeSplit")
      : t("settings.library.artistSplitModeOriginal")

  return (
    <>
      <SettingsScrollView>
        <ListGroup>
          <ListGroup.Item onPress={() => setArtistCharOpen(true)}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.library.artistCharDelimiters")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.library.artistCharDelimitersDescription")}
              </ListGroup.ItemDescription>
              <DelimiterChips values={config.artistCharDelimiters} />
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className="mx-4" />

          <ListGroup.Item onPress={() => setArtistWordOpen(true)}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>
                {t("settings.library.artistWordDelimiters")}
              </ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.library.artistWordDelimitersDescription")}
              </ListGroup.ItemDescription>
              <DelimiterChips values={config.artistWordDelimiters} />
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className="mx-4" />

          <SettingsSwitchRow
            title={t("settings.library.extractArtistFromTitle")}
            description={t("settings.library.extractArtistFromTitleDescription")}
            isSelected={config.extractArtistFromTitle}
            onSelectedChange={(selected) => {
              void updateSplitConfig({ extractArtistFromTitle: selected })
            }}
          />

          <Separator className="mx-4" />

          <ListGroup.Item onPress={() => setUnsplitArtistsOpen(true)}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.library.unsplitArtists")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.library.unsplitArtistsDescription")}
              </ListGroup.ItemDescription>
              <DelimiterChips values={config.unsplitArtists} />
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className="mx-4" />

          <ListGroup.Item onPress={() => setGenreSymbolsOpen(true)}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.library.genreSplitSymbols")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.library.genreSplitSymbolsDescription")}
              </ListGroup.ItemDescription>
              <DelimiterChips values={config.genreSplitSymbols} />
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className="mx-4" />

          <ListGroup.Item onPress={() => router.push("/settings/artist-split-mode")}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.library.artistSplitMode")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>{currentModeLabel}</ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </SettingsScrollView>

      <TagEditorSheet
        isOpen={artistCharOpen}
        onOpenChange={setArtistCharOpen}
        title={t("settings.library.artistCharDelimiters")}
        values={config.artistCharDelimiters}
        placeholder={t("settings.library.splitSymbolsPlaceholder")}
        addLabel={t("settings.library.addSplitSymbol")}
        removeLabel={t("settings.library.removeSplitSymbol")}
        onChange={(artistCharDelimiters) => {
          void updateSplitConfig({ artistCharDelimiters })
        }}
      />

      <TagEditorSheet
        isOpen={artistWordOpen}
        onOpenChange={setArtistWordOpen}
        title={t("settings.library.artistWordDelimiters")}
        values={config.artistWordDelimiters}
        placeholder={t("settings.library.artistWordDelimitersPlaceholder")}
        addLabel={t("settings.library.addSplitSymbol")}
        removeLabel={t("settings.library.removeSplitSymbol")}
        onChange={(artistWordDelimiters) => {
          void updateSplitConfig({ artistWordDelimiters })
        }}
      />

      <TagEditorSheet
        isOpen={unsplitArtistsOpen}
        onOpenChange={setUnsplitArtistsOpen}
        title={t("settings.library.unsplitArtists")}
        values={config.unsplitArtists}
        placeholder={t("settings.library.unsplitArtistsPlaceholder")}
        addLabel={t("settings.library.addUnsplitArtist")}
        removeLabel={t("settings.library.removeUnsplitArtist")}
        onChange={(unsplitArtists) => {
          void updateSplitConfig({ unsplitArtists })
        }}
      />

      <TagEditorSheet
        isOpen={genreSymbolsOpen}
        onOpenChange={setGenreSymbolsOpen}
        title={t("settings.library.genreSplitSymbols")}
        values={config.genreSplitSymbols}
        placeholder={t("settings.library.splitSymbolsPlaceholder")}
        addLabel={t("settings.library.addSplitSymbol")}
        removeLabel={t("settings.library.removeSplitSymbol")}
        onChange={(genreSplitSymbols) => {
          void updateSplitConfig({ genreSplitSymbols })
        }}
      />
    </>
  )
}
