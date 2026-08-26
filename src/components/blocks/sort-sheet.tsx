import { BottomSheet, Button, PressableFeedback, useThemeColor } from "heroui-native"
import * as React from "react"
import { createContext, use } from "react"
import { Text } from "react-native"
import type { GestureResponderEvent } from "react-native"
import { isSharedValue } from "react-native-reanimated"
import { useTranslation } from "react-i18next"
import { cn } from "tailwind-variants"

import LocalArrowDown02Icon from "@/components/icons/local/arrow-down-02"
import LocalArrowUp02Icon from "@/components/icons/local/arrow-up-02"

export interface SortOption<T extends string> {
  field: T
  label: string
}

type SortOrder = "asc" | "desc"

interface SortSheetContextValue<T extends string> {
  visible: boolean
  onOpenChange: (open: boolean) => void
  currentField: T
  currentOrder: SortOrder
  onSelect: (field: T, order?: SortOrder) => void
}

interface SortSheetRootProps<T extends string> {
  visible: boolean
  onOpenChange: (open: boolean) => void
  currentField: T
  currentOrder: SortOrder
  onSelect: (field: T, order?: SortOrder) => void
  children: React.ReactNode
}

interface SortSheetTriggerProps extends Omit<
  React.ComponentProps<typeof PressableFeedback>,
  "children"
> {
  label: string
  iconSize?: number
  className?: string
  textClassName?: string
}

interface SortSheetContentProps<T extends string> {
  options: SortOption<T>[]
  title?: string
  className?: string
}

const SortSheetContext = createContext<SortSheetContextValue<string> | null>(null)

function useSortSheetContext<T extends string>() {
  const context = use(SortSheetContext)
  if (!context) {
    throw new Error("SortSheet compound components must be used inside SortSheet.")
  }
  const erased: unknown = context
  // SAFETY: the root stores its payload erased to string keys; each compound consumer restores the T supplied by its Root
  return erased as SortSheetContextValue<T>
}

function SortSheetRoot<T extends string>({
  visible,
  onOpenChange,
  currentField,
  currentOrder,
  onSelect,
  children,
}: SortSheetRootProps<T>) {
  const value: SortSheetContextValue<string> = {
    visible,
    onOpenChange,
    currentField,
    currentOrder,
    onSelect: (field: string, order?: SortOrder) =>
      // SAFETY: option keys rendered from this Root's payload are always members of its T
      onSelect(field as T, order),
  }

  return <SortSheetContext value={value}>{children}</SortSheetContext>
}

function SortSheetTrigger({
  label,
  iconSize = 14,
  className,
  textClassName,
  onPress,
  ...props
}: SortSheetTriggerProps) {
  const muted = useThemeColor("muted")
  const { onOpenChange, currentOrder } = useSortSheetContext<string>()
  // SAFETY: heroui accepts SharedValue handlers and its contravariance-disabled variant evades isSharedValue narrowing; only plain functions are callable here
  const onPressHandler =
    onPress && !isSharedValue(onPress)
      ? (onPress as (event: GestureResponderEvent) => void)
      : undefined

  function handlePress(event: GestureResponderEvent) {
    if (onPressHandler) {
      onPressHandler(event)
    }
    onOpenChange(true)
  }

  return (
    <PressableFeedback
      className={cn("flex-row items-center gap-1 active:opacity-50", className)}
      onPress={handlePress}
      {...props}
    >
      <Text className={cn("text-sm font-medium text-muted", textClassName)}>{label}</Text>
      {currentOrder === "asc" ? (
        <LocalArrowUp02Icon fill="none" width={iconSize} height={iconSize} color={muted} />
      ) : (
        <LocalArrowDown02Icon fill="none" width={iconSize} height={iconSize} color={muted} />
      )}
    </PressableFeedback>
  )
}

function SortSheetContent<T extends string>({
  options,
  title,
  className,
}: SortSheetContentProps<T>) {
  const accent = useThemeColor("accent")
  const { t } = useTranslation()
  const { visible, onOpenChange, currentField, currentOrder, onSelect } = useSortSheetContext<T>()

  const handleSelect = (field: T) => {
    if (currentField === field) {
      const newOrder = currentOrder === "asc" ? "desc" : "asc"
      onSelect(field, newOrder)
    } else {
      onSelect(field, "asc")
    }
    onOpenChange(false)
  }

  return (
    <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content backgroundClassName="bg-surface" className={cn("gap-1", className)}>
          <BottomSheet.Title className="mb-2 text-xl">
            {title ?? t("library.sortBy")}
          </BottomSheet.Title>
          {options.map((option) => (
            <PressableFeedback
              key={option.field}
              className="h-14 flex-row items-center justify-between active:opacity-50"
              onPress={() => handleSelect(option.field)}
            >
              <Text
                className={cn(
                  "text-base",
                  currentField === option.field
                    ? "font-semibold text-accent"
                    : "font-medium text-foreground"
                )}
              >
                {t(option.label)}
              </Text>

              {currentField === option.field && (
                <Button variant="ghost" isIconOnly>
                  {currentOrder === "asc" ? (
                    <LocalArrowUp02Icon fill="none" width={24} height={24} color={accent} />
                  ) : (
                    <LocalArrowDown02Icon fill="none" width={24} height={24} color={accent} />
                  )}
                </Button>
              )}
            </PressableFeedback>
          ))}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}

type SortSheetComponent = typeof SortSheetRoot & {
  Trigger: typeof SortSheetTrigger
  Content: typeof SortSheetContent
}

// SAFETY: Trigger and Content are attached immediately below; SortSheetComponent mirrors that exact shape
const SortSheet = SortSheetRoot as SortSheetComponent
SortSheet.Trigger = SortSheetTrigger
SortSheet.Content = SortSheetContent

export { SortSheet }
