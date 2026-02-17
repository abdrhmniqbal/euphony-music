import type { ReactNode } from "react"
import { Text, View } from "react-native"
import { cn } from "tailwind-variants"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  message: string
  className?: string
}

export function EmptyState({
  icon,
  title,
  message,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn("items-center justify-center px-6 py-12", className)}>
      {icon ? (
        <View className="mb-4 rounded-full bg-default/50 p-6">{icon}</View>
      ) : null}
      <Text className="mb-2 text-center text-xl font-bold text-foreground">
        {title}
      </Text>
      <Text className="text-center leading-relaxed text-muted">{message}</Text>
    </View>
  )
}
