import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, Text, View } from "react-native";
import { cn } from "tailwind-variants";
import { Card } from "@/components/ui";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface MusicCardProps {
  title: string;
  subtitle: string;
  image?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  className?: string;
}

export function MusicCard({
  title,
  subtitle,
  image,
  icon = "musical-note",
  onPress,
  className,
}: MusicCardProps) {
  const theme = useThemeColors();

  return (
    <Pressable onPress={onPress} className={cn("w-36 active:opacity-70", className)}>
      <Card tone="default" padding="none" className="mb-2 h-36 w-36 overflow-hidden rounded-lg border-none">
        {image ? (
          <Image source={{ uri: image }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center bg-surface-secondary">
            <Ionicons name={icon} size={48} color={theme.muted} />
          </View>
        )}
      </Card>
      <Text className="w-36 text-sm font-bold text-foreground" numberOfLines={1}>
        {title}
      </Text>
      <Text className="w-36 text-xs text-muted" numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}
