import React, { createContext, useContext } from "react";
import { View, Text, Pressable, type PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet, Button, PressableFeedback } from "heroui-native";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { cn } from "tailwind-variants";
import LocalArrowUpIcon from "@/components/icons/local/arrow-up";
import LocalArrowDownIcon from "@/components/icons/local/arrow-down";

export interface SortOption<T extends string> {
  field: T;
  label: string;
}

type SortOrder = "asc" | "desc";

interface SortSheetContextValue<T extends string> {
  visible: boolean;
  onOpenChange: (open: boolean) => void;
  currentField: T;
  currentOrder: SortOrder;
  onSelect: (field: T, order?: SortOrder) => void;
}

interface SortSheetRootProps<T extends string> {
  visible: boolean;
  onOpenChange: (open: boolean) => void;
  currentField: T;
  currentOrder: SortOrder;
  onSelect: (field: T, order?: SortOrder) => void;
  children: React.ReactNode;
}

interface SortSheetTriggerProps extends PressableProps {
  label: string;
  iconSize?: number;
  className?: string;
  textClassName?: string;
}

interface SortSheetContentProps<T extends string> {
  options: SortOption<T>[];
  title?: string;
  className?: string;
}

const SortSheetContext = createContext<SortSheetContextValue<string> | null>(
  null,
);

function useSortSheetContext<T extends string>() {
  const context = useContext(SortSheetContext);
  if (!context) {
    throw new Error(
      "SortSheet compound components must be used inside SortSheet.",
    );
  }
  return context as unknown as SortSheetContextValue<T>;
}

function SortSheetRoot<T extends string>({
  visible,
  onOpenChange,
  currentField,
  currentOrder,
  onSelect,
  children,
}: SortSheetRootProps<T>) {
  return (
    <SortSheetContext.Provider
      value={
        {
          visible,
          onOpenChange,
          currentField,
          currentOrder,
          onSelect,
        } as unknown as SortSheetContextValue<string>
      }
    >
      {children}
    </SortSheetContext.Provider>
  );
}

function SortSheetTrigger({
  label,
  iconSize = 14,
  className,
  textClassName,
  onPress,
  ...props
}: SortSheetTriggerProps) {
  const theme = useThemeColors();
  const { onOpenChange, currentOrder } = useSortSheetContext<string>();

  function handlePress(
    event: Parameters<NonNullable<PressableProps["onPress"]>>[0],
  ) {
    onPress?.(event);
    onOpenChange(true);
  }

  return (
    <Pressable
      className={cn("flex-row items-center gap-1 active:opacity-50", className)}
      onPress={handlePress}
      {...props}
    >
      <Text className={cn("text-sm font-medium text-muted", textClassName)}>
        {label}
      </Text>
      {currentOrder == "asc" ? (
        <LocalArrowUpIcon
          fill="none"
          width={iconSize}
          height={iconSize}
          color={theme.muted}
        />
      ) : (
        <LocalArrowDownIcon
          fill="none"
          width={iconSize}
          height={iconSize}
          color={theme.muted}
        />
      )}
    </Pressable>
  );
}

function SortSheetContent<T extends string>({
  options,
  title = "Sort By",
  className,
}: SortSheetContentProps<T>) {
  const theme = useThemeColors();
  const { visible, onOpenChange, currentField, currentOrder, onSelect } =
    useSortSheetContext<T>();

  const handleSelect = (field: T) => {
    if (currentField === field) {
      const newOrder = currentOrder === "asc" ? "desc" : "asc";
      onSelect(field, newOrder);
    } else {
      onSelect(field, "asc");
    }
    onOpenChange(false);
  };

  return (
    <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
      <BottomSheet.Portal >
        <BottomSheet.Overlay />
        <BottomSheet.Content
        backgroundClassName="bg-surface"
          className={cn("gap-1", className)}
        >
          <BottomSheet.Title className="text-xl mb-2">
            {title}
          </BottomSheet.Title>
          {options.map((option) => (
            <PressableFeedback
              key={option.field}
              className="flex-row items-center justify-between h-14 active:opacity-50"
              onPress={() => handleSelect(option.field)}
            >
              <Text
                className={cn(
                  "text-base",
                  currentField === option.field
                    ? "text-accent font-semibold"
                    : "text-foreground font-medium",
                )}
              >
                {option.label}
              </Text>

              {currentField === option.field && (
                <Button variant="ghost" isIconOnly>
                  {currentOrder == "asc" ? (
                    <LocalArrowUpIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.accent}
                    />
                  ) : (
                    <LocalArrowDownIcon
                      fill="none"
                      width={24}
                      height={24}
                      color={theme.accent}
                    />
                  )}
                </Button>
              )}
            </PressableFeedback>
          ))}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

export const SortSheet = Object.assign(SortSheetRoot, {
  Trigger: SortSheetTrigger,
  Content: SortSheetContent,
});
