import type { ReactNode } from "react"
import { Button } from "heroui-native"
import { View } from "react-native"

interface HeaderAction {
  key: string
  icon: ReactNode
  onPress: () => void
}

interface StackHeaderActionsProps {
  actions: HeaderAction[]
}

export function StackHeaderActions({ actions }: StackHeaderActionsProps) {
  return (
    <View className="-mr-2 flex-row gap-4">
      {actions.map((action) => (
        <Button key={action.key} onPress={action.onPress} variant="ghost" isIconOnly>
          {action.icon}
        </Button>
      ))}
    </View>
  )
}
