import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { Card } from "heroui-native"
import { MarqueeText } from "@/modules/shared/components/ui/marquee-text"
import type { MetadataLayoutItem } from "./metadata-derivation"

interface MetadataGridProps {
  layoutItems: MetadataLayoutItem[]
  onSheetClose: () => void
}

export const MetadataGrid: React.FC<MetadataGridProps> = ({ layoutItems, onSheetClose }) => {
  return (
    <ScrollView className="flex-1">
      <View className="flex-row flex-wrap gap-2">
        {layoutItems.map((item) => {
          const containerClassName = item.isFullWidth ? "w-full" : "w-[48.5%]"
          const hasNavigableValues = item.segments.some((segment) => Boolean(segment.onPress))
          const navigableTextStyle = hasNavigableValues
            ? {
                textDecorationLine: "underline" as const,
                textDecorationStyle: "dotted" as const,
              }
            : undefined

          const content = (
            <Card className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
              <Text className="mb-1 text-xs font-medium text-muted uppercase">{item.label}</Text>
              {hasNavigableValues ? (
                <Text className="text-sm leading-5 text-foreground" numberOfLines={1}>
                  {item.segments.map((segment, segmentIndex) => (
                    <React.Fragment
                      key={`${item.label}-${segment.value}-${segment.onPress ? "link" : "text"}`}
                    >
                      {segment.onPress ? (
                        <Text
                          className="text-sm leading-5 text-foreground"
                          suppressHighlighting
                          style={navigableTextStyle}
                          onPress={() => {
                            onSheetClose()
                            segment.onPress?.()
                          }}
                        >
                          {segment.value}
                        </Text>
                      ) : (
                        <Text className="text-sm leading-5 text-foreground">{segment.value}</Text>
                      )}
                      {segmentIndex < item.segments.length - 1 ? (
                        <Text className="text-sm leading-5 text-foreground">{", "}</Text>
                      ) : null}
                    </React.Fragment>
                  ))}
                </Text>
              ) : (
                <MarqueeText
                  text={item.displayValue}
                  className="text-sm leading-5 text-foreground"
                />
              )}
            </Card>
          )

          return (
            <View key={item.label} className={containerClassName}>
              {content}
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}
