import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { cn } from "tailwind-variants";
import { useThemeColors } from "@/hooks/use-theme-colors";
import LocalPlaySolidIcon from "../icons/local/play-solid";
import LocalShuffleSolidIcon from "../icons/local/shuffle-solid";

interface PlaybackActionsRowProps {
  onPlay: () => void;
  onShuffle: () => void;
  className?: string;
}

export function PlaybackActionsRow({
  onPlay,
  onShuffle,
  className,
}: PlaybackActionsRowProps) {
  const theme = useThemeColors();

  return (
    <View className={cn("mb-6 flex-row gap-4", className)}>
      <Button
        className="flex-1 rounded-xl"
        variant="secondary"
        size="lg"
        onPress={onPlay}
      >
        <LocalPlaySolidIcon
          fill="none"
          width={24}
          height={24}
          color={theme.foreground}
        />
        <Text className="text-lg font-bold uppercase text-foreground">
          Play
        </Text>
      </Button>
      <Button
        className="flex-1 rounded-xl"
        variant="secondary"
        size="lg"
        onPress={onShuffle}
      >
        <LocalShuffleSolidIcon
          fill="none"
          width={24}
          height={24}
          color={theme.foreground}
        />
        <Text className="text-lg font-bold uppercase text-foreground">
          Shuffle
        </Text>
      </Button>
    </View>
  );
}
