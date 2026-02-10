import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { cn } from "tailwind-variants";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface PlaybackActionsRowProps {
  onPlay: () => void;
  onShuffle: () => void;
  className?: string;
}

export function PlaybackActionsRow({ onPlay, onShuffle, className }: PlaybackActionsRowProps) {
  const theme = useThemeColors();

  return (
    <View className={cn("mb-6 flex-row gap-4", className)}>
      <Button
        className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-default"
        onPress={onPlay}
      >
        <Ionicons name="play" size={20} color={theme.foreground} />
        <Text className="text-lg font-bold uppercase text-foreground">Play</Text>
      </Button>
      <Button
        className="h-14 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-default"
        onPress={onShuffle}
      >
        <Ionicons name="shuffle" size={20} color={theme.foreground} />
        <Text className="text-lg font-bold uppercase text-foreground">Shuffle</Text>
      </Button>
    </View>
  );
}
