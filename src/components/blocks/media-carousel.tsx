import type { ReactNode } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { cn } from "tailwind-variants";
import { EmptyState } from "@/components/ui";

interface EmptyStateConfig {
  icon: string;
  title: string;
  message: string;
}

interface MediaCarouselProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  emptyState?: EmptyStateConfig;
  gap?: number;
  paddingHorizontal?: number;
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function MediaCarousel<T>({
  data,
  renderItem,
  keyExtractor,
  emptyState,
  gap = 16,
  paddingHorizontal = 16,
  className,
  contentContainerStyle,
}: MediaCarouselProps<T>) {
  if (data.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon as any}
        title={emptyState.title}
        message={emptyState.message}
        className={cn("mb-8 py-8", className)}
      />
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[{ paddingHorizontal, gap }, contentContainerStyle]}
      className={cn("mb-8", className)}
    >
      {data.map((item, index) => (
        <View key={keyExtractor(item, index)}>{renderItem(item, index)}</View>
      ))}
    </ScrollView>
  );
}
