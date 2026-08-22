import type { PlaylistFormProps } from "./types"
import type { Track } from "@/modules/player/types"
import { Button, Input, ListGroup, PressableFeedback, TextArea } from "heroui-native"

import { Image } from "expo-image"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import ReorderableList, { useIsActive, useReorderableDrag } from "react-native-reorderable-list"
import LocalAdd01Icon from "@/modules/shared/components/icons/local/add-01"
import LocalCancel01Icon from "@/modules/shared/components/icons/local/cancel-01"
import LocalDragDropVerticalIcon from "@/modules/shared/components/icons/local/drag-drop-vertical"
import LocalMusicNote04SolidIcon from "@/modules/shared/components/icons/local/music-note-04-solid"
import { EmptyState } from "@/modules/shared/components/ui/empty-state"
import { useThemeColors } from "@/modules/ui/theme"

import { MAX_PLAYLIST_DESCRIPTION_LENGTH, MAX_PLAYLIST_NAME_LENGTH } from "@/modules/playlist/utils"

interface ReorderableSelectedTrackRowProps {
  track: Track
  index: number
  onToggle: (trackId: string) => void
}

function ReorderableSelectedTrackRow({ track, index: _index, onToggle }: ReorderableSelectedTrackRowProps) {
  const drag = useReorderableDrag()
  const isActive = useIsActive()
  const theme = useThemeColors()
  const { t } = useTranslation()

  return (
    <View
      className="flex-row items-center p-4 gap-3"
      style={{
        backgroundColor: isActive ? theme.border : "transparent",
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
        <LocalDragDropVerticalIcon fill="none" width={20} height={20} color={theme.muted} />
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
            <LocalMusicNote04SolidIcon fill="none" width={22} height={22} color={theme.muted} />
          </View>
        )}
      </View>
      <View className="flex-1">
        <ListGroup.ItemTitle>{track.title}</ListGroup.ItemTitle>
        <ListGroup.ItemDescription>
          {track.artist || t("library.unknownArtist")}
        </ListGroup.ItemDescription>
      </View>
      <PressableFeedback
        onPress={(event) => {
          event.stopPropagation()
          onToggle(track.id)
        }}
        className="p-1 opacity-60"
      >
        <LocalCancel01Icon fill="none" width={20} height={20} color={theme.muted} />
      </PressableFeedback>
    </View>
  )
}

export function PlaylistForm({
  form,
  selectedTracksList,
  toggleTrack,
  reorderSelectedTracks,
  openTrackSheet,
}: PlaylistFormProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()

  const header = (
    <View className="gap-4 px-4 pt-4 pb-3">
      <form.Field name="name">
        {(field) => (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-foreground">{t("playlist.name")}</Text>
              <Text className="text-xs text-muted">
                {field.state.value.length}/{MAX_PLAYLIST_NAME_LENGTH}
              </Text>
            </View>
            <Input
              placeholder={t("playlist.namePlaceholder")}
              value={field.state.value}
              onChangeText={(val) => field.handleChange(val)}
              maxLength={MAX_PLAYLIST_NAME_LENGTH}
            />
          </View>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-foreground">
                {t("playlist.description")}
              </Text>
              <Text className="text-xs text-muted">
                {field.state.value.length}/{MAX_PLAYLIST_DESCRIPTION_LENGTH}
              </Text>
            </View>
            <TextArea
              placeholder={t("playlist.descriptionPlaceholder")}
              value={field.state.value}
              onChangeText={(val) => field.handleChange(val)}
              maxLength={MAX_PLAYLIST_DESCRIPTION_LENGTH}
              className="min-h-20"
            />
          </View>
        )}
      </form.Field>

      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">
          {t("library.count.track", {
            count: selectedTracksList.length,
          })}
        </Text>
        <Button variant="ghost" onPress={openTrackSheet}>
          <View className="flex-row items-center gap-2">
            <LocalAdd01Icon fill="none" width={18} height={18} color={theme.foreground} />
            <Text className="font-semibold text-foreground">{t("playlist.addTracks")}</Text>
          </View>
        </Button>
      </View>
    </View>
  )

  return (
    <View className="flex-1 bg-background">
      <ReorderableList
        data={selectedTracksList}
        onReorder={({ from, to }) => reorderSelectedTracks(from, to)}
        renderItem={({ item, index }) => (
          <ReorderableSelectedTrackRow track={item} index={index} onToggle={toggleTrack} />
        )}
        keyExtractor={(item) => item.id}
        shouldUpdateActiveItem
        scrollEnabled
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon={
              <LocalMusicNote04SolidIcon fill="none" width={48} height={48} color={theme.muted} />
            }
            title={t("library.empty.tracksSelectedTitle")}
            message={t("library.empty.selectedTracksMessage")}
            className="py-8"
          />
        }
        contentContainerStyle={{ paddingBottom: 224 }}
      />
    </View>
  )
}
