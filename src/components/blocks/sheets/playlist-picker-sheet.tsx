import { LegendList, type LegendListRenderItemProps } from "@legendapp/list/react-native"
import { BottomSheet, Button, Checkbox, Input, PressableFeedback, TextField } from "heroui-native"
import { useCallback, useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import { LEGEND_LIST_PICKER_CONFIG } from "@/components/blocks/legend-list-config"
import LocalAdd01Icon from "@/components/icons/local/add-01"
import LocalCancelCircleSolidIcon from "@/components/icons/local/cancel-circle-solid"
import LocalSearch01Icon from "@/components/icons/local/search-01"
import {
  PlaylistArtwork,
  resolvePlaylistArtworkImages,
} from "@/components/patterns/playlist-artwork"
import {
  MediaItem as Item,
  MediaItemContent as ItemContent,
  MediaItemDescription as ItemDescription,
  MediaItemImage as ItemImage,
  MediaItemTitle as ItemTitle,
} from "@/components/ui/media-item"
import { EmptyState } from "@/components/ui/empty-state"
import type { PlaylistPickerSelection } from "@/modules/playlist/types"
import { useThemeColors } from "@/modules/ui/theme"
import { usePlaylistsForTrack } from "@/modules/playlist/queries"
import { useBottomSheetSearchInput } from "@/components/blocks/use-bottom-sheet-search-input"

interface PlaylistPickerSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trackId?: string | null
  isSelecting?: boolean
  onSelectPlaylist: (playlist: PlaylistPickerSelection) => void
  onCreatePlaylist: () => void
}

const SNAP_POINTS = ["62%", "88%"]

export function PlaylistPickerSheet({
  isOpen,
  onOpenChange,
  trackId,
  isSelecting = false,
  onSelectPlaylist,
  onCreatePlaylist,
}: PlaylistPickerSheetProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const [searchInputKey, setSearchInputKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  const { data: playlists = [] } = usePlaylistsForTrack(trackId ?? null, isOpen)

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange(open)
      if (open) {
        return
      }

      setSearchQuery("")
      setSearchInputKey((previous) => previous + 1)
    },
    [onOpenChange]
  )

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredPlaylists =
    normalizedQuery.length > 0
      ? playlists.filter((playlist) => playlist.name.toLowerCase().includes(normalizedQuery))
      : playlists

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          index={1}
          snapPoints={SNAP_POINTS}
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full pt-16 pb-2"
          keyboardBehavior="extend"
          backgroundClassName="bg-surface"
        >
          <PlaylistPickerSearchInput
            inputKey={searchInputKey}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <LegendList
            data={filteredPlaylists}
            getItemType={() => "playlist"}
            keyExtractor={(item) => item.id}
            style={{ flex: 1, minHeight: 1 }}
            contentContainerStyle={{
              gap: 8,
              paddingTop: 6,
              paddingHorizontal: 16,
              paddingBottom: 20,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...LEGEND_LIST_PICKER_CONFIG}
            renderItem={({
              item,
            }: LegendListRenderItemProps<(typeof filteredPlaylists)[number]>) => {
              const hasTrack = Boolean(item.hasTrack)
              const handleSelect = () => {
                if (isSelecting) {
                  return
                }

                onSelectPlaylist({
                  id: item.id,
                  name: item.name,
                  hasTrack,
                })
              }

              return (
                <Item onPress={handleSelect}>
                  <View className="pr-2">
                    <Checkbox
                      variant="secondary"
                      isSelected={hasTrack}
                      isDisabled={isSelecting}
                      onSelectedChange={handleSelect}
                      accessibilityLabel={t("playlist.selectPlaylist", {
                        name: item.name,
                      })}
                    />
                  </View>

                  <ItemImage className="items-center justify-center overflow-hidden bg-default">
                    <PlaylistArtwork
                      images={resolvePlaylistArtworkImages(item.images, item.image)}
                    />
                  </ItemImage>

                  <ItemContent>
                    <ItemTitle>{item.name}</ItemTitle>
                    <ItemDescription>
                      {t("library.count.track", {
                        count: item.trackCount,
                      })}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              )
            }}
            ListEmptyComponent={() => (
              <View className="pt-6">
                <EmptyState
                  icon={
                    <LocalSearch01Icon fill="none" width={40} height={40} color={theme.muted} />
                  }
                  title={t("library.empty.playlistsFoundTitle")}
                  message={
                    normalizedQuery.length > 0
                      ? t("search.tryDifferentKeyword")
                      : t("library.empty.playlistsFoundMessage")
                  }
                  className="py-6"
                />
              </View>
            )}
          />

          <View className="border-t border-default-soft-hover px-4 pt-3 pb-3">
            <Button variant="secondary" onPress={onCreatePlaylist} isDisabled={isSelecting}>
              <View className="flex-row items-center gap-2">
                <LocalAdd01Icon fill="none" width={18} height={18} color={theme.foreground} />
                <Text className="font-semibold text-foreground">
                  {t("playlist.createNewPlaylist")}
                </Text>
              </View>
            </Button>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}

function PlaylistPickerSearchInput({
  inputKey,
  searchQuery,
  setSearchQuery,
}: {
  inputKey: number
  searchQuery: string
  setSearchQuery: (value: string) => void
}) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const { inputRef, handleOnFocus, handleOnBlur } = useBottomSheetSearchInput()

  return (
    <TextField className="absolute top-0 right-0 left-0 px-5 pt-2">
      <View className="w-full flex-row items-center">
        <Input
          key={inputKey}
          ref={inputRef}
          placeholder={t("playlist.searchPlaceholder")}
          onChangeText={setSearchQuery}
          className="flex-1 pr-10 pl-12"
          variant="secondary"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
        />
        <View className="absolute left-3.5" pointerEvents="none">
          <LocalSearch01Icon fill="none" width={24} height={24} color={theme.muted} />
        </View>
        {searchQuery.length > 0 ? (
          <PressableFeedback
            className="absolute right-3 p-1"
            onPress={() => {
              inputRef.current?.clear()
              setSearchQuery("")
            }}
            hitSlop={12}
          >
            <LocalCancelCircleSolidIcon fill="none" width={18} height={18} color={theme.muted} />
          </PressableFeedback>
        ) : null}
      </View>
    </TextField>
  )
}
