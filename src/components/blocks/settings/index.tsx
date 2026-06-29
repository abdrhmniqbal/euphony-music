import { useLocalSearchParams } from "expo-router"
import * as React from "react"
import { Animated, ScrollView, View, type ScrollViewProps } from "react-native"
import { ListGroup, Separator, Switch } from "heroui-native"
import { useThemeColors } from "@/modules/ui/theme"

interface SettingsScrollViewContextType {
  scrollViewRef: React.RefObject<ScrollView | null> | null
  containerRef: React.RefObject<View | null> | null
}

export const SettingsScrollViewContext = React.createContext<SettingsScrollViewContextType>({
  scrollViewRef: null,
  containerRef: null,
})

export function SettingsScrollView({
  children,
  ...props
}: ScrollViewProps & { children: React.ReactNode }) {
  const scrollViewRef = React.useRef<ScrollView>(null)
  const containerRef = React.useRef<View>(null)

  const contextValue = React.useMemo(
    () => ({ scrollViewRef, containerRef }),
    [scrollViewRef, containerRef]
  )

  return (
    <SettingsScrollViewContext.Provider value={contextValue}>
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 bg-background"
        contentContainerStyle={[{ paddingBottom: 40 }, props.contentContainerStyle]}
        {...props}
      >
        <View ref={containerRef} className="gap-5 px-4 py-4">
          {children}
        </View>
      </ScrollView>
    </SettingsScrollViewContext.Provider>
  )
}

export function SettingsHighlight({ id, children }: { id: string; children: React.ReactNode }) {
  const params = useLocalSearchParams<{ highlight?: string }>()
  const { scrollViewRef, containerRef } = React.useContext(SettingsScrollViewContext)
  const theme = useThemeColors()
  const itemRef = React.useRef<View>(null)
  const animOpacity = React.useRef(new Animated.Value(0)).current
  const hasScrolled = React.useRef(false)
  const pendingScroll = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    hasScrolled.current = false
    animOpacity.setValue(0)
    if (pendingScroll.current) {
      clearTimeout(pendingScroll.current)
      pendingScroll.current = null
    }
  }, [params.highlight, id, animOpacity])

  React.useEffect(() => {
    if (
      params.highlight !== id ||
      hasScrolled.current ||
      !scrollViewRef?.current ||
      !containerRef?.current
    ) {
      return
    }

    pendingScroll.current = setTimeout(() => {
      const containerNode = containerRef.current
      if (containerNode) {
        itemRef.current?.measureLayout(
          containerNode as any,
          (_x, y) => {
            hasScrolled.current = true
            scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true })

            Animated.sequence([
              Animated.timing(animOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
              Animated.delay(1000),
              Animated.timing(animOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]).start()
          },
          () => {}
        )
      }
    }, 150)

    return () => {
      if (pendingScroll.current) {
        clearTimeout(pendingScroll.current)
        pendingScroll.current = null
      }
    }
  }, [animOpacity, containerRef, id, params.highlight, scrollViewRef])

  const interpolatedOpacity = animOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  })

  return (
    <View ref={itemRef} className="relative">
      {children}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.accent,
          opacity: interpolatedOpacity,
        }}
        pointerEvents="none"
        className="rounded-xl"
      />
    </View>
  )
}

export function SettingsListGroup({ children }: { children: React.ReactNode }) {
  const childrenArray = React.Children.toArray(children).filter(React.isValidElement)

  return (
    <ListGroup>
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {index > 0 && <Separator className="mx-4" />}
          {child}
        </React.Fragment>
      ))}
    </ListGroup>
  )
}

export function SettingsNavigationRow({
  title,
  description,
  onPress,
  disabled,
}: {
  title: string
  description?: string | null
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <ListGroup.Item onPress={onPress} disabled={disabled}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription> : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  )
}

export function SettingsSwitchRow({
  title,
  description,
  isSelected,
  onSelectedChange,
  disabled,
}: {
  title: string
  description?: string | null
  isSelected: boolean
  onSelectedChange: (selected: boolean) => void
  disabled?: boolean
}) {
  return (
    <ListGroup.Item disabled={disabled}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription> : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <Switch isSelected={isSelected} onSelectedChange={onSelectedChange} isDisabled={disabled} />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  )
}
