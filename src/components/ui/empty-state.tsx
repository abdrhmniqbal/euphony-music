/**
 * Purpose: Displays empty-state messaging with optional iconography and balanced spacing.
 * Caller: Route screens and shared lists when no user content is available.
 * Dependencies: React Native text and view primitives, tailwind-variants class merging.
 * Main Functions: EmptyState()
 * Side Effects: None.
 */

import type { ReactNode } from "react"
import { Text, View } from "react-native"
import { cn } from "tailwind-variants"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  message: string
  className?: string
}

export function EmptyState({ icon, title, message, className }: EmptyStateProps) {
  return (
    <View className={cn("items-center justify-center px-6 py-12", className)}>
      {icon ? (
        <View className="mb-5 rounded-[26px] border border-border/60 bg-default/60 p-5">
          {icon}
        </View>
      ) : null}
      <View className="max-w-[280px] items-center">
        <Text className="mb-2 text-center text-[22px] font-semibold tracking-[-0.4px] text-foreground">
          {title}
        </Text>
        <Text className="text-center text-sm leading-6 text-muted">{message}</Text>
      </View>
    </View>
  )
}
