import * as React from "react"
import { createContext, use } from "react"
import { BottomSheet, Button, PressableFeedback } from "heroui-native"
import { Text } from "react-native"
import { cn } from "tailwind-variants"

import { useThemeColors } from "@/hooks/use-theme-colors"
import LocalArrowDownIcon from "@/components/icons/local/arrow-down"
import LocalArrowUpIcon from "@/components/icons/local/arrow-up"

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

const SortSheetContext = createContext<SortSheetContextValue<string> | null>(
  null
)

function useSortSheetContext<T extends string>() {
  const context = use(SortSheetContext)
  if (!context) {
    throw new Error(
      "SortSheet compound components must be used inside SortSheet."
    )
  }
  return context as unknown as SortSheetContextValue<T>
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
    <SortSheetContext
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
    </SortSheetContext>
  )
}

function SortSheetTrigger({
  label,
  iconSize = 14,
  className,
  textClassName,
  onPress,
  ...props
}: SortSheetTriggerProps) {
  const theme = useThemeColors()
  const { onOpenChange, currentOrder } = useSortSheetContext<string>()

  function handlePress(
    event: Parameters<
      NonNullable<React.ComponentProps<typeof PressableFeedback>["onPress"]>
    >[0]
  ) {
    onPress?.(event)
    onOpenChange(true)
  }

  return (
    <PressableFeedback
      className={cn("flex-row items-center gap-1 active:opacity-50", className)}
      onPress={handlePress}
      {...props}
    >
      <Text className={cn("text-sm font-medium text-muted", textClassName)}>
        {label}
      </Text>
      {currentOrder === "asc" ? (
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
    </PressableFeedback>
  )
}

function SortSheetContent<T extends string>({
  options,
  title = "Sort By",
  className,
}: SortSheetContentProps<T>) {
  const theme = useThemeColors()
  const { visible, onOpenChange, currentField, currentOrder, onSelect } =
    useSortSheetContext<T>()

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
        <BottomSheet.Content
          backgroundClassName="bg-surface"
          className={cn("gap-1", className)}
        >
          <BottomSheet.Title className="mb-2 text-xl">
            {title}
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
                {option.label}
              </Text>

              {currentField === option.field && (
                <Button variant="ghost" isIconOnly>
                  {currentOrder === "asc" ? (
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
  )
}

type SortSheetComponent = typeof SortSheetRoot & {
  Trigger: typeof SortSheetTrigger
  Content: typeof SortSheetContent
}

const SortSheet = SortSheetRoot as SortSheetComponent
SortSheet.Trigger = SortSheetTrigger
SortSheet.Content = SortSheetContent

export { SortSheet }
