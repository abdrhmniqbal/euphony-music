import * as React from "react"
import { ActivityIndicator, Text, View } from "react-native"

import { useThemeColors } from "@/hooks/use-theme-colors"

interface LibraryLoadingStateProps {
  itemCount?: number
}

export const LibraryLoadingState: React.FC<LibraryLoadingStateProps> = ({
  itemCount = 0,
}) => {
  const theme = useThemeColors()

  return (
    <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size="large" color={theme.accent} />
      <Text className="mt-4 text-base text-muted">
        {itemCount > 0 ? `Loading ${itemCount} items...` : "Loading library..."}
      </Text>
    </View>
  )
}
