import { View, type ReactNode } from "react-native";
import type { Track } from "@/modules/player/player.store";
import { MediaItem } from "@/components/ui";

interface TrackRowProps {
  track: Track;
  onPress?: () => void;
  variant?: "list" | "grid";
  leftAction?: ReactNode;
  rank?: ReactNode;
  showCover?: boolean;
  showArtist?: boolean;
  rightAction?: ReactNode;
  className?: string;
  imageClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function TrackRow({
  track,
  onPress,
  variant = "list",
  leftAction,
  rank,
  showCover = true,
  showArtist = true,
  rightAction,
  className,
  imageClassName,
  titleClassName,
  descriptionClassName,
}: TrackRowProps) {
  return (
    <MediaItem variant={variant} onPress={onPress} className={className}>
      {leftAction ? <View className="py-2 pr-1">{leftAction}</View> : null}
      {showCover ? <MediaItem.Image icon="musical-note" image={track.image} className={imageClassName} /> : null}
      {rank !== undefined && rank !== null ? <MediaItem.Rank>{rank}</MediaItem.Rank> : null}
      <MediaItem.Content>
        <MediaItem.Title className={titleClassName}>{track.title}</MediaItem.Title>
        {showArtist ? (
          <MediaItem.Description className={descriptionClassName}>
            {track.artist || "Unknown Artist"}
          </MediaItem.Description>
        ) : null}
      </MediaItem.Content>
      {rightAction ? <View className="p-2">{rightAction}</View> : null}
    </MediaItem>
  );
}
