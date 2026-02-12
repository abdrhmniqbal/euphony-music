import { useRouter } from "expo-router";
import type { ComponentProps } from "react";
import { Button } from "heroui-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import LocalArrowLeftIcon from "@/components/icons/local/arrow-left";

type BackButtonProps = {
  onPress?: () => void;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
};

export function BackButton({
  onPress,
  variant = "ghost",
  className,
}: BackButtonProps) {
  const theme = useThemeColors();
  const router = useRouter();

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    router.back();
  }

  return (
    <Button
      onPress={handlePress}
      variant={variant}
      className={className}
      isIconOnly
    >
      <LocalArrowLeftIcon
        fill="none"
        width={24}
        height={24}
        color={theme.foreground}
      />
    </Button>
  );
}
