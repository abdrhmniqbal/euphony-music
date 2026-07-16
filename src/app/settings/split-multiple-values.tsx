/**
 * Purpose: Lets users configure tag-based symbol splitting for artists/genres, unsplit artist exceptions, and artist display mode.
 * Caller: Settings split-multiple-values route.
 * Dependencies: HeroUI Native BottomSheet, ListGroup, Chip, TagGroup, form controls, settings split config module/store, indexer relation rebuild.
 * Main Functions: SplitMultipleValuesSettingsScreen(), TagEditorSheet()
 * Side Effects: Persists split settings config and rebuilds split metadata relations.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { BottomSheet, Button, Chip, ListGroup, Separator, TagGroup } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import LocalAdd01Icon from "@/modules/shared/components/icons/local/add-01"
import { BottomSheetInput } from "@/modules/shared/components/ui/bottom-sheet-input"
import { rebuildSplitRelationsForConfig } from "@/modules/indexer/service"
import { setSplitMultipleValueConfig } from "@/modules/settings/split-multiple-values"
import { SettingsSwitchRow } from "@/modules/settings/ui"
import { useSettingsStore } from "@/modules/settings/store"
import { useThemeColors } from "@/modules/ui/theme"

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

interface TagEditorSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
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
}: Omit<TagEditorSheetProps, "isOpen" | "onOpenChange" | "title">) {
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
        <BottomSheetInput
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={addValue}
          placeholder={placeholder}
          className="flex-1 min-h-12"
          returnKeyType="done"
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

export default function SplitMultipleValuesSettingsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const config = useSettingsStore((state) => state.splitMultipleValueConfig)
  const [artistCharOpen, setArtistCharOpen] = React.useState(false)
  const [artistWordOpen, setArtistWordOpen] = React.useState(false)
  const [unsplitArtistsOpen, setUnsplitArtistsOpen] = React.useState(false)
  const [genreSymbolsOpen, setGenreSymbolsOpen] = React.useState(false)

  async function updateSplitConfig(next: Partial<SplitMultipleValueConfig>) {
    const updated = await setSplitMultipleValueConfig(next)
    await rebuildSplitRelationsForConfig(updated)
  }

  const currentModeLabel =
    config.artistSplitMode === "split"
      ? t("settings.library.artistSplitModeSplit")
      : t("settings.library.artistSplitModeOriginal")

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5 px-4 py-4">
          <ListGroup>
            <ListGroup.Item onPress={() => setArtistCharOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>
                  {t("settings.library.artistCharDelimiters")}
                </ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.artistCharDelimitersDescription")}
                </ListGroup.ItemDescription>
                {config.artistCharDelimiters.length > 0 ? (
                  <View className="mt-1.5 flex-row flex-wrap gap-1">
                    {config.artistCharDelimiters.map((s) => (
                      <Chip key={s} variant="secondary" size="sm">
                        <Chip.Label>{s}</Chip.Label>
                      </Chip>
                    ))}
                  </View>
                ) : null}
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
                {config.artistWordDelimiters.length > 0 ? (
                  <View className="mt-1.5 flex-row flex-wrap gap-1">
                    {config.artistWordDelimiters.map((s) => (
                      <Chip key={s} variant="secondary" size="sm">
                        <Chip.Label>{s}</Chip.Label>
                      </Chip>
                    ))}
                  </View>
                ) : null}
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>

            <Separator className="mx-4" />

            <SettingsSwitchRow
              title={t("settings.library.extractArtistFromTitle")}
              description={t("settings.library.extractArtistFromTitleDescription")}
              isSelected={config.extractArtistFromTitle}
              onSelectedChange={(selected) =>
                void updateSplitConfig({ extractArtistFromTitle: selected })
              }
            />

            <Separator className="mx-4" />

            <ListGroup.Item onPress={() => setUnsplitArtistsOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.library.unsplitArtists")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.library.unsplitArtistsDescription")}
                </ListGroup.ItemDescription>
                {config.unsplitArtists.length > 0 ? (
                  <View className="mt-1.5 flex-row flex-wrap gap-1">
                    {config.unsplitArtists.map((a) => (
                      <Chip key={a} variant="secondary" size="sm">
                        <Chip.Label>{a}</Chip.Label>
                      </Chip>
                    ))}
                  </View>
                ) : null}
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
                {config.genreSplitSymbols.length > 0 ? (
                  <View className="mt-1.5 flex-row flex-wrap gap-1">
                    {config.genreSplitSymbols.map((s) => (
                      <Chip key={s} variant="secondary" size="sm">
                        <Chip.Label>{s}</Chip.Label>
                      </Chip>
                    ))}
                  </View>
                ) : null}
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
        </View>
      </ScrollView>

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
