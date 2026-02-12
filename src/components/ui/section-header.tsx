import { Pressable, Text, View } from "react-native";
import { cn } from "tailwind-variants";
import { useThemeColors } from "@/hooks/use-theme-colors";
import LocalChevronRightIcon from "../icons/local/chevron-right";
import { Button } from "heroui-native";

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
          <Button onPress={onViewMore} hitSlop={20} variant="ghost" className="-mr-3" isIconOnly>
            <LocalChevronRightIcon fill="none"  width={20} height={20} color={theme.muted} />
          </Button> 
        ) : null}
      </View>
      {subtitle ? <Text className="mt-0.5 text-xs text-muted">{subtitle}</Text> : null}
    </View>
  );
}

export const SectionTitle = SectionHeader;
