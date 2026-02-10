import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";
import { Text, View } from "react-native";
import { cn } from "tailwind-variants";
import { useThemeColors } from "@/hooks/use-theme-colors";

type EmptyStateIconComponent = ComponentType<{
  size?: number;
  color?: string;
}>;

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconComponent?: EmptyStateIconComponent;
  title: string;
  message: string;
  className?: string;
}

export function EmptyState({
  icon,
  iconComponent: IconComponent,
  title,
  message,
  className,
}: EmptyStateProps) {
  const theme = useThemeColors();

  return (
    <View className={cn("items-center justify-center px-6 py-12", className)}>
      <View className="mb-4 rounded-full bg-default/50 p-6">
        {IconComponent ? (
          <IconComponent size={48} color={theme.muted} />
        ) : icon ? (
          <Ionicons name={icon} size={48} color={theme.muted} />
        ) : null}
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-foreground">{title}</Text>
      <Text className="text-center leading-relaxed text-muted">{message}</Text>
    </View>
  );
}
