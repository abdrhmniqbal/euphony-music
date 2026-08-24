import { useLocalSearchParams } from "expo-router"
import { Stack } from "expo-router"
import {
  BottomSheet,
  Button,
  Checkbox,
  Input,
  PressableFeedback,
  TextArea,
  TextField,
  useThemeColor,
} from "heroui-native"
import * as React from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import ReorderableList, { useIsActive, useReorderableDrag } from "react-native-reorderable-list"
import { LegendList } from "@legendapp/list/react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import LocalAdd01Icon from "@/components/icons/local/add-01"
import LocalCancel01Icon from "@/components/icons/local/cancel-01"
import LocalCancelCircleSolidIcon from "@/components/icons/local/cancel-circle-solid"
import LocalDragDropVerticalIcon from "@/components/icons/local/drag-drop-vertical"
import LocalMusicNote04SolidIcon from "@/components/icons/local/music-note-04-solid"
import LocalSearch01Icon from "@/components/icons/local/search-01"
import LocalTick02Icon from "@/components/icons/local/tick-02"
import { TrackRow } from "@/components/patterns/track-row"
import { BackButton } from "@/components/patterns/back-button"
import { EmptyState } from "@/components/ui/empty-state"
import { useGuardedRouter } from "@/core/navigation"
import {
  MAX_PLAYLIST_DESCRIPTION_LENGTH,
  MAX_PLAYLIST_NAME_LENGTH,
} from "@/domains/playlists/utils"
import {
  clearPlaylistFormDraft,
  consumePlaylistFormDraft,
} from "@/domains/playlists/form-draft-store"
import { usePlaylistFormEditor } from "@/domains/playlists/use-form-editor"
import { usePlaylist } from "@/domains/playlists/queries"
import type { PlayerTrack } from "@/playback/types"

const TRACK_PICKER_SNAP_POINTS = ["72%", "90%"]

function ReorderableSelectedTrackRow({
  track,
  onToggle,
}: {
  track: PlayerTrack
  onToggle: (trackId: string) => void
}) {
  const drag = useReorderableDrag()
  const isActive = useIsActive()
  const [border, muted] = useThemeColor(["border", "muted"])
  const { t } = useTranslation()

  return (
    <View
      className="flex-row items-center gap-3 p-4"
      style={{
        backgroundColor: isActive ? border : "transparent",
        opacity: isActive ? 0.9 : 1,
      }}
    >
      <PressableFeedback
        onPressIn={(event) => {
          event.stopPropagation()
          drag()
        }}
        className="p-1 opacity-60"
      >
        <LocalDragDropVerticalIcon fill="none" width={20} height={20} color={muted} />
      </PressableFeedback>
      <View className="size-14 overflow-hidden rounded-xl bg-surface">
        {track.image ? (
          <Image
            source={{ uri: track.image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <LocalMusicNote04SolidIcon fill="none" width={22} height={22} color={muted} />
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{track.title}</Text>
        <Text className="text-xs text-muted">{track.artist || t("library.unknownArtist")}</Text>
      </View>
      <PressableFeedback
        onPress={(event) => {
          event.stopPropagation()
          onToggle(track.id)
        }}
        className="p-1 opacity-60"
      >
        <LocalCancel01Icon fill="none" width={20} height={20} color={muted} />
      </PressableFeedback>
    </View>
  )
}

function PlaylistFormScreen() {
  const router = useGuardedRouter()
  const [accent, muted, foreground] = useThemeColor(["accent", "muted", "foreground"])
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const rawId = Array.isArray(id) ? id[0] : id
  const playlistId = rawId?.trim() || undefined
  const isEditMode = Boolean(playlistId)
  // SAFETY: the empty create-mode draft mirrors PlaylistFormDraftState returned by consumePlaylistFormDraft
  const [initialCreateDraft] = React.useState(() =>
    isEditMode
      ? { source: null as "queue" | null, trackIds: [] as string[] }
      : consumePlaylistFormDraft()
  )
  const initialCreateTrackIds = initialCreateDraft.trackIds
  const isQueueDraft = initialCreateDraft.source === "queue"

  const { data: playlistToEdit, isLoading: isEditPlaylistLoading } = usePlaylist(
    playlistId ?? "",
    isEditMode
  )

  const editor = usePlaylistFormEditor({
    playlistId,
    initialName: playlistToEdit?.name ?? "",
    initialDescription: playlistToEdit?.description ?? "",
    initialSelectedTrackIds: isEditMode
      ? (playlistToEdit?.tracks.map((rel) => rel.trackId) ?? [])
      : initialCreateTrackIds,
    isEditMode,
    onSaved: closeForm,
  })

  function closeForm() {
    clearPlaylistFormDraft()

    if (isQueueDraft) {
      router.dismissTo("/(main)/(library)")
      return
    }

    if (router.canGoBack?.()) {
      router.back()
      return
    }

    router.replace("/(main)/(library)")
  }

  const canSave = editor.isNameValid && !editor.isSubmitting

  if (isEditMode && (isEditPlaylistLoading || !playlistToEdit)) {
    return (
      <View className={isEditPlaylistLoading ? "flex-1 bg-background" : "flex-1 bg-background"}>
        <Stack.Screen options={{ title: t("playlist.editPlaylist") }} />
      </View>
    )
  }

  const selectedCount = editor.draftSelectedTracks.size

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: isEditMode ? t("playlist.editPlaylist") : t("playlist.createPlaylist"),
          headerLeft: () => <BackButton className="-ml-2" onPress={closeForm} />,
          headerRight: () => (
            <Button
              onPress={() => {
                void editor.submit()
              }}
              variant="ghost"
              className="-mr-2"
              isIconOnly
              isDisabled={!canSave}
            >
              <LocalTick02Icon
                fill="none"
                width={24}
                height={24}
                color={canSave ? accent : muted}
              />
            </Button>
          ),
        }}
      />

      <ReorderableList
        data={editor.selectedTracksList}
        onReorder={({ from, to }) => editor.reorderSelectedTracks(from, to)}
        renderItem={({ item }) => (
          <ReorderableSelectedTrackRow track={item} onToggle={editor.toggleSelectedTrack} />
        )}
        keyExtractor={(item) => item.id}
        shouldUpdateActiveItem
        scrollEnabled
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="gap-4 px-4 pt-4 pb-3">
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">{t("playlist.name")}</Text>
                <Text className="text-xs text-muted">
                  {editor.name.length}/{MAX_PLAYLIST_NAME_LENGTH}
                </Text>
              </View>
              <Input
                placeholder={t("playlist.namePlaceholder")}
                value={editor.name}
                onChangeText={editor.setName}
                maxLength={MAX_PLAYLIST_NAME_LENGTH}
              />
            </View>

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">
                  {t("playlist.description")}
                </Text>
                <Text className="text-xs text-muted">
                  {editor.description.length}/{MAX_PLAYLIST_DESCRIPTION_LENGTH}
                </Text>
              </View>
              <TextArea
                placeholder={t("playlist.descriptionPlaceholder")}
                value={editor.description}
                onChangeText={editor.setDescription}
                maxLength={MAX_PLAYLIST_DESCRIPTION_LENGTH}
                className="min-h-20"
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">
                {t("library.count.track", { count: editor.selectedTracksList.length })}
              </Text>
              <Button variant="ghost" onPress={editor.openTrackSheet}>
                <View className="flex-row items-center gap-2">
                  <LocalAdd01Icon fill="none" width={18} height={18} color={foreground} />
                  <Text className="font-semibold text-foreground">{t("playlist.addTracks")}</Text>
                </View>
              </Button>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={muted} />}
            title={t("library.empty.tracksFoundTitle")}
            message={t("library.empty.playlistsMessage")}
            className="py-8"
          />
        }
        contentContainerStyle={{ paddingBottom: 224 }}
      />

      <BottomSheet
        isOpen={editor.isTrackSheetOpen}
        onOpenChange={(open) => {
          if (!open) editor.handleTrackSheetClose()
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            index={1}
            snapPoints={TRACK_PICKER_SNAP_POINTS}
            enableOverDrag={false}
            enableDynamicSizing={false}
            contentContainerClassName="h-full pt-16 pb-2"
            keyboardBehavior="extend"
            backgroundClassName="bg-surface"
          >
            <TextField className="absolute top-0 right-0 left-0 px-5 pt-2">
              <View className="w-full flex-row items-center">
                <Input
                  key={editor.searchInputKey}
                  placeholder={t("playlist.searchTracksPlaceholder")}
                  onChangeText={editor.setSearchQuery}
                  className="flex-1 pr-10 pl-12"
                  variant="secondary"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View className="absolute left-3.5" pointerEvents="none">
                  <LocalSearch01Icon fill="none" width={24} height={24} color={muted} />
                </View>
                {editor.searchQuery.length > 0 ? (
                  <PressableFeedback
                    className="absolute right-3 p-1"
                    onPress={() => editor.setSearchQuery("")}
                    hitSlop={12}
                  >
                    <LocalCancelCircleSolidIcon fill="none" width={18} height={18} color={muted} />
                  </PressableFeedback>
                ) : null}
              </View>
            </TextField>

            <LegendList
              data={editor.filteredTracks}
              renderItem={({ item }) => (
                <TrackRow
                  track={item}
                  onPress={() => editor.toggleDraftTrack(item.id)}
                  className="w-full py-2"
                  leftAction={
                    <Checkbox
                      variant="secondary"
                      isSelected={editor.draftSelectedTracks.has(item.id)}
                      onSelectedChange={() => editor.toggleDraftTrack(item.id)}
                      accessibilityLabel={t("playlist.selectTrack", { title: item.title })}
                      className="mt-0.5"
                    />
                  }
                />
              )}
              keyExtractor={(item) => item.id}
              style={{ flex: 1, minHeight: 1, width: "100%" }}
              contentContainerStyle={{ paddingTop: 6, paddingBottom: 24, paddingHorizontal: 4 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              recycleItems
              estimatedItemSize={64}
              ListEmptyComponent={() => (
                <EmptyState
                  icon={
                    <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={muted} />
                  }
                  title={t("library.empty.tracksFoundTitle")}
                  message={t("search.tryDifferentKeyword")}
                  className="py-10"
                />
              )}
            />

            <View
              className="border-t border-default-soft-hover px-4 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 12) }}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm text-muted">
                  {t("playlist.selected", { count: selectedCount })}
                </Text>
                <Button
                  onPress={editor.clearDraftTrackSelection}
                  variant="ghost"
                  isDisabled={selectedCount === 0}
                  className="h-8 px-0"
                >
                  {t("playlist.clearSelection")}
                </Button>
              </View>
              <Button
                onPress={editor.applyTrackSheetSelection}
                variant="primary"
                className="w-full"
              >
                {selectedCount === 0
                  ? t("playlist.apply")
                  : t("playlist.applyWithCount", { count: selectedCount })}
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  )
}

export default PlaylistFormScreen
