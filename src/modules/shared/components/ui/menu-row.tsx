import { PressableFeedback } from "heroui-native"
import { Text, View } from "react-native"

interface MenuRowProps {
  icon: React.ReactNode
  label: string
  onPress: () => void
  colorClassName?: string
  trailing?: React.ReactNode
}

export function MenuRow({ icon, label, onPress, colorClassName, trailing }: MenuRowProps) {
  return (
    <PressableFeedback
      className="h-13 flex-row items-center gap-4 active:opacity-50"
      onPress={onPress}
    >
      <View className="w-6 items-center justify-center">{icon}</View>
      <Text className={`flex-1 text-base font-medium ${colorClassName ?? "text-foreground"}`}>
        {label}
      </Text>
      {trailing ? <View>{trailing}</View> : null}
    </PressableFeedback>
  )
}
