import * as React from "react"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import { BottomSheet, Button } from "heroui-native"
import { View } from "react-native"

import { useThemeColors } from "@/hooks/use-theme-colors"
import { usePlaylistFormScreen } from "@/modules/playlist/hooks/use-playlist-form"
import LocalTickIcon from "@/components/icons/local/tick"
import {
  PlaylistForm,
  TrackPickerSheetContent,
} from "@/components/blocks/playlist-form"

export default function PlaylistFormScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const theme = useThemeColors()
  const playlistId = typeof id === "string" ? id : undefined

  const {
    name,
    description,
    selectedTracks,
    isTrackSheetOpen,
    searchInputKey,
    searchQuery,
    filteredTracks,
    isEditMode,
    isSaving,
    canSave,
    selectedTracksList,
    setName,
    setDescription,
    setSearchQuery,
    toggleTrack,
    openTrackSheet,
    handleTrackSheetOpenChange,
    save,
  } = usePlaylistFormScreen(() => router.back(), playlistId)

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: isEditMode ? "Edit Playlist" : "Create Playlist",
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
        setName={setName}
        setDescription={setDescription}
        toggleTrack={toggleTrack}
        openTrackSheet={openTrackSheet}
      />

      <BottomSheet
        isOpen={isTrackSheetOpen}
        onOpenChange={handleTrackSheetOpenChange}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <TrackPickerSheetContent
            inputKey={searchInputKey}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredTracks={filteredTracks}
            selectedTracks={selectedTracks}
            onToggleTrack={toggleTrack}
          />
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  )
}
