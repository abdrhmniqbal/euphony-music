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
import { PlaylistForm, TrackPickerSheetContent } from "@/components/blocks/playlist-form"
import LocalTick02Icon from "@/components/icons/local/tick-02"
import { BackButton } from "@/components/patterns/back-button"
import { Stack } from "@/layouts/stack"
import {
  clearPlaylistFormDraft,
  consumePlaylistFormDraft,
} from "@/modules/playlist/form-draft-store"
import { usePlaylistFormEditor } from "@/modules/playlist/use-form-editor"
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
    form,
    selectedTracksList,
    toggleSelectedTrack: toggleTrack,
    reorderSelectedTracks,
    isTrackSheetOpen,
    searchInputKey,
    searchQuery,
    setSearchQuery,
    filteredTracks,
    draftSelectedTracks,
    openTrackSheet,
    handleTrackSheetClose,
    toggleDraftTrack,
    applyTrackSheetSelection,
    clearDraftTrackSelection,
  } = usePlaylistFormEditor({
    playlistId,
    initialName,
    initialDescription,
    initialSelectedTrackIds,
    isEditMode,
    onSaved,
  })

  return (
    <form.Subscribe
      selector={(state) => ({
        isSubmitting: state.isSubmitting,
        isValid: state.isValid,
      })}
    >
      {({ isSubmitting, isValid }) => {
        const canSave = isValid && !isSubmitting

        return (
          <>
            <Stack.Screen
              options={{
                title: isEditMode ? t("playlist.editPlaylist") : t("playlist.createPlaylist"),
                headerLeft: () => <BackButton className="-ml-2" onPress={onCancel} />,
                headerRight: () => (
                  <Button
                    onPress={() => form.handleSubmit()}
                    variant="ghost"
                    className="-mr-2"
                    isIconOnly
                    isDisabled={!canSave}
                  >
                    <LocalTick02Icon
                      fill="none"
                      width={24}
                      height={24}
                      color={canSave ? theme.accent : theme.muted}
                    />
                  </Button>
                ),
              }}
            />

            <PlaylistForm
              form={form}
              selectedTracksList={selectedTracksList}
              toggleTrack={toggleTrack}
              reorderSelectedTracks={reorderSelectedTracks}
              openTrackSheet={openTrackSheet}
            />

            <BottomSheet
              isOpen={isTrackSheetOpen}
              onOpenChange={(open) => {
                if (!open) handleTrackSheetClose()
              }}
            >
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
      }}
    </form.Subscribe>
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

  if (isEditMode && (isEditPlaylistLoading || !playlistToEdit)) {
    return (
      <View
        className={isEditPlaylistLoading ? "flex-1 bg-background pt-4" : "flex-1 bg-background"}
      >
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
