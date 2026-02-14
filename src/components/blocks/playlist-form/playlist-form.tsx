import { Button, Input, TextArea } from "heroui-native";
import { ScrollView, Text, View } from "react-native";
import { EmptyState } from "@/components/ui";
import { useThemeColors } from "@/hooks/use-theme-colors";
import LocalAddCircleIcon from "@/components/icons/local/add-circle";
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid";
import {
  MAX_PLAYLIST_DESCRIPTION_LENGTH,
  MAX_PLAYLIST_NAME_LENGTH,
} from "@/modules/playlist/playlist.utils";
import { PlaylistTrackRow } from "./playlist-track-row";
import type { PlaylistFormProps } from "./types";

export function PlaylistForm({
  name,
  description,
  selectedTracksList,
  setName,
  setDescription,
  toggleTrack,
  openTrackSheet,
}: PlaylistFormProps) {
  const theme = useThemeColors();

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 200, gap: 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">
            Playlist Name
          </Text>
          <Text className="text-xs text-muted">
            {name.length}/{MAX_PLAYLIST_NAME_LENGTH}
          </Text>
        </View>
        <Input
          variant="secondary"
          placeholder="Playlist name"
          value={name}
          onChangeText={setName}
          maxLength={MAX_PLAYLIST_NAME_LENGTH}
        />
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">
            Description
          </Text>
          <Text className="text-xs text-muted">
            {description.length}/{MAX_PLAYLIST_DESCRIPTION_LENGTH}
          </Text>
        </View>
        <TextArea
          variant="secondary"
          placeholder="Add a description"
          value={description}
          onChangeText={setDescription}
          maxLength={MAX_PLAYLIST_DESCRIPTION_LENGTH}
          className="min-h-20"
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">
          {selectedTracksList.length} Tracks
        </Text>
        <Button variant="ghost" onPress={openTrackSheet}>
          <View className="flex-row items-center gap-2">
            <LocalAddCircleIcon
              fill="none"
              width={18}
              height={18}
              color={theme.foreground}
            />
            <Text className="text-foreground font-semibold">Add Tracks</Text>
          </View>
        </Button>
      </View>

      {selectedTracksList.length > 0 ? (
        <View style={{ gap: 8 }}>
          {selectedTracksList.map((track) => (
            <PlaylistTrackRow
              key={track.id}
              track={track}
              isSelected
              onPress={() => toggleTrack(track.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={
            <LocalMusicNoteSolidIcon
              fill="none"
              width={48}
              height={48}
              color={theme.muted}
            />
          }
          title="No tracks selected"
          message="Tap Add Tracks to start building this playlist."
          className="py-8"
        />
      )}
    </ScrollView>
  );
}
