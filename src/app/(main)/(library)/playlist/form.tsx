/**
 * Purpose: Renders playlist create/edit form with optional preselected tracks from temporary draft state.
 * Caller: Playlist routes, playlist picker creation action, and player queue save action.
 * Dependencies: playlist form components, playlist editor hook, playlist form draft store, playlist queries, router params, theme colors.
 * Main Functions: PlaylistFormScreen(), PlaylistFormEditor()
 * Side Effects: Creates or updates playlists, clears temporary draft state, and opens the track picker bottom sheet.
 */

import { useLocalSearchParams } from "expo-router"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { BottomSheet, Button } from "heroui-native"
import * as React from "react"

import { View } from "react-native"
import { useTranslation } from "react-i18next"
import { PlaylistForm } from "@/components/blocks/playlist-form/playlist-form"
import { TrackPickerSheetContent } from "@/components/blocks/playlist-form/track-picker-sheet-content"
import LocalTickIcon from "@/components/icons/local/tick"
import { BackButton } from "@/components/patterns/back-button"
import { Stack } from "@/layouts/stack"
import {
  clearPlaylistFormDraft,
  consumePlaylistFormDraft,
} from "@/modules/playlist/form-draft.store"
import { usePlaylistFormEditor } from "@/modules/playlist/form-editor.hook"
import { usePlaylist } from "@/modules/playlist/queries"
import { useThemeColors } from "@/modules/ui/theme"

interface PlaylistFormEditorProps {
  playlistId?: string
  initialName: string
  initialDescription: string
  initialSelectedTrackIds: string[]
  isEditMode: boolean
  onCancel: () => void
  onSaved: () => void
}

function PlaylistFormEditor({
  playlistId,
  initialName,
  initialDescription,
  initialSelectedTrackIds,
  isEditMode,
  onCancel,
  onSaved,
}: PlaylistFormEditorProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const {
    name,
    description,
    selectedTracksList,
    isTrackSheetOpen,
    searchInputKey,
    searchQuery,
    filteredTracks,
    draftSelectedTracks,
    isSaving,
    canSave,
    setSearchQuery,
    updateName,
    updateDescription,
    toggleSelectedTrack,
    reorderSelectedTracks,
    openTrackSheet,
    handleTrackSheetOpenChange,
    toggleDraftTrack,
    applyTrackSheetSelection,
    clearDraftTrackSelection,
    save,
  } = usePlaylistFormEditor({
    playlistId,
    initialName,
    initialDescription,
    initialSelectedTrackIds,
    isEditMode,
    onSaved,
  })

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? t("playlist.editPlaylist") : t("playlist.createPlaylist"),
          headerLeft: () => <BackButton className="-ml-2" onPress={onCancel} />,
          headerRight: () => (
            <Button
              onPress={save}
              variant="ghost"
              className="-mr-2"
              isIconOnly
              isDisabled={!canSave || isSaving}
            >
              <LocalTickIcon
                fill="none"
                width={24}
                height={24}
                color={canSave || isSaving ? theme.accent : theme.muted}
              />
            </Button>
          ),
        }}
      />

      <PlaylistForm
        name={name}
        description={description}
        selectedTracksList={selectedTracksList}
        setName={updateName}
        setDescription={updateDescription}
        toggleTrack={toggleSelectedTrack}
        reorderSelectedTracks={reorderSelectedTracks}
        openTrackSheet={openTrackSheet}
      />

      <BottomSheet isOpen={isTrackSheetOpen} onOpenChange={handleTrackSheetOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <TrackPickerSheetContent
            inputKey={searchInputKey}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredTracks={filteredTracks}
            selectedTracks={draftSelectedTracks}
            onToggleTrack={toggleDraftTrack}
            onApply={applyTrackSheetSelection}
            onClearSelection={clearDraftTrackSelection}
          />
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  )
}

export default function PlaylistFormScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{
    id?: string
  }>()
  const playlistId = typeof id === "string" ? id : undefined
  const isEditMode = Boolean(playlistId?.trim())
  const [initialCreateDraft] = React.useState(() =>
    isEditMode ? { source: null, trackIds: [] } : consumePlaylistFormDraft()
  )
  const initialCreateTrackIds = initialCreateDraft.trackIds
  const isQueueDraft = initialCreateDraft.source === "queue"
  const { data: playlistToEdit, isLoading: isEditPlaylistLoading } = usePlaylist(
    playlistId?.trim() ?? "",
    isEditMode
  )

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

  if (isEditMode && isEditPlaylistLoading) {
    return (
      <View className="flex-1 bg-background pt-4">
        <Stack.Screen
          options={{
            title: t("playlist.editPlaylist"),
          }}
        />
      </View>
    )
  }

  if (isEditMode && !playlistToEdit) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen
          options={{
            title: t("playlist.editPlaylist"),
          }}
        />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <PlaylistFormEditor
        key={isEditMode ? (playlistId ?? "edit") : `create-${initialCreateTrackIds.length}`}
        playlistId={playlistId}
        initialName={playlistToEdit?.name ?? ""}
        initialDescription={playlistToEdit?.description ?? ""}
        initialSelectedTrackIds={
          isEditMode
            ? (playlistToEdit?.tracks?.map((playlistTrack) => playlistTrack.trackId) ?? [])
            : initialCreateTrackIds
        }
        isEditMode={isEditMode}
        onCancel={closeForm}
        onSaved={closeForm}
      />
    </View>
  )
}
