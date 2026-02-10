import { View } from "react-native";
import { chunkArray } from "@/utils/array";
import type { Track } from "@/modules/player/player.store";
import { playTrack } from "@/modules/player/player.store";
import { TrackRow } from "@/components/patterns";
import { MediaCarousel } from "./media-carousel";

interface EmptyStateConfig {
  icon: string;
  title: string;
  message: string;
}

interface RankedTrackCarouselProps {
  data: Track[];
  chunkSize?: number;
  emptyState?: EmptyStateConfig;
  onItemPress?: (track: Track) => void;
  className?: string;
}

export function RankedTrackCarousel({
  data,
  chunkSize = 5,
  emptyState,
  onItemPress,
  className,
}: RankedTrackCarouselProps) {
  const chunks = chunkArray(data, chunkSize);

  const handlePress = (track: Track) => {
    if (onItemPress) {
      onItemPress(track);
      return;
    }

    playTrack(track, data);
  };

  return (
    <MediaCarousel
      data={chunks}
      keyExtractor={(_, index) => `chunk-${index}`}
      emptyState={emptyState}
      gap={24}
      className={className}
      renderItem={(chunk, chunkIndex) => (
        <View className="w-75">
          {chunk.map((track, index) => (
            <TrackRow
              key={`${track.id}-${chunkIndex}-${index}`}
              track={track}
              rank={chunkIndex * chunkSize + index + 1}
              onPress={() => handlePress(track)}
            />
          ))}
        </View>
      )}
    />
  );
}
