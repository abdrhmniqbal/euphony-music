import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { BottomSheet, ScrollShadow, useThemeColor } from "heroui-native";
import { EmptyState } from "@/components/ui";
import { useThemeColors } from "@/hooks/use-theme-colors";
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid";
import { PlaylistTrackRow } from "./playlist-track-row";
import { SheetSearchInput } from "./sheet-search-input";
import type { TrackPickerSheetContentProps } from "./types";

const TRACK_PICKER_SNAP_POINTS = ["55%", "90%"];

export function TrackPickerSheetContent({
  inputKey,
  searchQuery,
  setSearchQuery,
  filteredTracks,
  selectedTracks,
  onToggleTrack,
}: TrackPickerSheetContentProps) {
  const overlayColor = useThemeColor("overlay");
  const theme = useThemeColors();

  return (
    <BottomSheet.Content
      snapPoints={TRACK_PICKER_SNAP_POINTS}
      enableOverDrag={false}
      enableDynamicSizing={false}
      contentContainerClassName="h-full pt-16 pb-2"
      keyboardBehavior="extend"
      backgroundClassName="bg-surface"
    >
      <SheetSearchInput
        inputKey={inputKey}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <ScrollShadow
        LinearGradientComponent={LinearGradient}
        color={overlayColor}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
          keyboardShouldPersistTaps="handled"
        >
          {filteredTracks.length > 0 ? (
            filteredTracks.map((track) => (
              <PlaylistTrackRow
                key={track.id}
                track={track}
                isSelected={selectedTracks.has(track.id)}
                onPress={() => onToggleTrack(track.id)}
              />
            ))
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
              title="No tracks found"
              message="Try a different keyword."
              className="py-10"
            />
          )}
        </BottomSheetScrollView>
      </ScrollShadow>
    </BottomSheet.Content>
  );
}
