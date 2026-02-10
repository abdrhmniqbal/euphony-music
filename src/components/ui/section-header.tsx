import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { cn } from "tailwind-variants";
import { useThemeColors } from "@/hooks/use-theme-colors";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  onViewMore?: () => void;
}

export function SectionHeader({
  title,
  subtitle,
  className,
  onViewMore,
}: SectionHeaderProps) {
  const theme = useThemeColors();

  return (
    <View className={cn("mb-4", className)}>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-foreground">{title}</Text>
        {onViewMore ? (
          <Pressable onPress={onViewMore} hitSlop={20}>
            <Ionicons name="chevron-forward" size={20} color={theme.muted} />
          </Pressable>
        ) : null}
      </View>
      {subtitle ? <Text className="mt-0.5 text-xs text-muted">{subtitle}</Text> : null}
    </View>
  );
}

export const SectionTitle = SectionHeader;
