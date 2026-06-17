/**
 * Purpose: Shows a reusable bottom sheet for choosing one artist from multiple resolved artist values.
 * Caller: Track action sheet and player route.
 * Dependencies: HeroUI Native BottomSheet, expo-image, and shared artist picker item types.
 * Main Functions: ArtistPickerSheet()
 * Side Effects: Triggers artist navigation callbacks for selected values.
 */

import { Image } from "expo-image"
import { BottomSheet, PressableFeedback } from "heroui-native"
import { Text, View } from "react-native"

export interface ArtistPickerSheetItem {
  value: string
  subtitle?: string
  image?: string
}

interface ArtistPickerSheetProps {
  isOpen: boolean
  title: string
  items: ArtistPickerSheetItem[]
  onOpenChange: (open: boolean) => void
  onSelectValue: (value: string) => void
}

export function ArtistPickerSheet({
  isOpen,
  title,
  items,
  onOpenChange,
  onSelectValue,
}: ArtistPickerSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content backgroundClassName="bg-surface" className="gap-1 pb-4">
          <Text className="px-1 pb-2 text-base font-semibold text-foreground">{title}</Text>
          {items.map((item) => (
            <PressableFeedback
              key={item.value}
              className="flex-row items-center gap-3 rounded-xl px-1 py-2 active:opacity-60"
              onPress={() => onSelectValue(item.value)}
            >
              <View className="h-10 w-10 overflow-hidden rounded-full bg-default">
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-default">
                    <Text className="text-sm font-semibold text-muted">
                      {item.value.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base text-foreground">{item.value}</Text>
                {item.subtitle ? <Text className="text-sm text-muted">{item.subtitle}</Text> : null}
              </View>
            </PressableFeedback>
          ))}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  )
}
