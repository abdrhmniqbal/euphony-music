import type { ReactNode } from "react"
import { Image } from "expo-image"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { createContext, use } from "react"
import {
  Text,
  type TextProps,
  View,
  type ViewProps,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import Animated, { isSharedValue, type SharedValue } from "react-native-reanimated"
import Transition from "react-native-screen-transitions"
import { cn, tv, type VariantProps } from "tailwind-variants"

const mediaItemStyles = tv({
  slots: {
    base: "border-none bg-transparent",
    imageContainer: "items-center justify-center overflow-hidden rounded-lg bg-surface",
    content: "flex-1 justify-center gap-0.5",
    title: "text-foreground font-bold",
    description: "text-xs text-muted",
    rank: "w-8 text-center text-lg font-bold text-foreground",
  },
  variants: {
    variant: {
      list: {
        base: "flex-row items-center gap-3 bg-transparent py-2.5",
        imageContainer: "h-14 w-14",
        title: "text-base",
      },
      grid: {
        base: "w-36 gap-2",
        imageContainer: "aspect-square w-full",
        content: "w-full",
        title: "text-base leading-tight",
      },
    },
  },
  defaultVariants: {
    variant: "list",
  },
})

type MediaItemVariant = VariantProps<typeof mediaItemStyles>

interface MediaItemContextValue {
  variant: NonNullable<MediaItemVariant["variant"]>
}

const MediaItemContext = createContext<MediaItemContextValue>({
  variant: "list",
})

const BoundaryPressableFeedback = Transition.createBoundaryComponent(PressableFeedback)

type MediaItemProps = React.ComponentProps<typeof PressableFeedback> &
  MediaItemVariant & {
    boundaryId?: string
  }

function MediaItemRoot({
  className,
  variant = "list",
  boundaryId,
  id,
  children,
  onLongPress,
  onPress,
  onPressIn,
  onPressOut,
  delayLongPress = 500,
  ...props
}: MediaItemProps) {
  const { base } = mediaItemStyles({ variant })
  const didLongPressRef = React.useRef(false)
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // SAFETY: heroui accepts SharedValue handlers; only the plain-function branch is callable here
  const pressHandler = <T,>(handler: T | SharedValue<T> | null | undefined): T | undefined =>
    handler && !isSharedValue<T>(handler) ? handler : undefined
  const longPressHandler = pressHandler(onLongPress)
  const pressInHandler = pressHandler(onPressIn)
  const pressOutHandler = pressHandler(onPressOut)
  const pressOutOnlyHandler = pressHandler(onPress)
  const resolvedDelayLongPress =
    delayLongPress && !isSharedValue<number | null | undefined>(delayLongPress)
      ? delayLongPress
      : 500

  const clearLongPressTimer = React.useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const triggerLongPress = React.useCallback(
    (event: GestureResponderEvent) => {
      if (didLongPressRef.current) {
        return
      }
      didLongPressRef.current = true
      if (longPressHandler) {
        longPressHandler(event)
      }
    },
    [longPressHandler]
  )

  const handlePressIn = React.useCallback(
    (event: GestureResponderEvent) => {
      didLongPressRef.current = false
      if (pressInHandler) {
        pressInHandler(event)
      }
      if (!longPressHandler) {
        return
      }
      clearLongPressTimer()
      longPressTimerRef.current = setTimeout(() => {
        triggerLongPress(event)
      }, resolvedDelayLongPress)
    },
    [
      clearLongPressTimer,
      longPressHandler,
      pressInHandler,
      resolvedDelayLongPress,
      triggerLongPress,
    ]
  )

  const handlePressOut = React.useCallback(
    (event: GestureResponderEvent) => {
      clearLongPressTimer()
      if (pressOutHandler) {
        pressOutHandler(event)
      }
    },
    [clearLongPressTimer, pressOutHandler]
  )

  const handlePress = React.useCallback(
    (event: GestureResponderEvent) => {
      if (didLongPressRef.current) {
        didLongPressRef.current = false
        return
      }
      if (pressOutOnlyHandler) {
        pressOutOnlyHandler(event)
      }
    },
    [pressOutOnlyHandler]
  )

  const handleLongPress = React.useCallback(
    (event: GestureResponderEvent) => {
      clearLongPressTimer()
      triggerLongPress(event)
    },
    [clearLongPressTimer, triggerLongPress]
  )

  React.useEffect(() => clearLongPressTimer, [clearLongPressTimer])

  const interactionProps = {
    ...props,
    onPress: handlePress,
    onLongPress: handleLongPress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  }

  if (boundaryId) {
    return (
      <MediaItemContext value={{ variant }}>
        <BoundaryPressableFeedback
          // SAFETY: boundary ids are caller-supplied strings used to match transition boundaries
          id={id as string}
          className={cn(base(), className)}
          {...interactionProps}
        >
          {children}
        </BoundaryPressableFeedback>
      </MediaItemContext>
    )
  }

  return (
    <MediaItemContext value={{ variant }}>
      <PressableFeedback className={cn(base(), className)} {...interactionProps}>
        {children}
      </PressableFeedback>
    </MediaItemContext>
  )
}

type MediaItemImageProps = ViewProps & {
  icon?: ReactNode
  image?: string
  overlay?: ReactNode
}

function MediaItemImage({
  className,
  icon,
  image,
  overlay,
  children,
  ...props
}: MediaItemImageProps) {
  const { variant } = use(MediaItemContext)
  const { imageContainer } = mediaItemStyles({ variant })

  return (
    <View className={cn(imageContainer(), className)} {...props}>
      {image ? (
        <View className="h-full w-full overflow-hidden rounded-lg">
          <Image
            source={{ uri: image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
      ) : (
        icon || children
      )}
      {overlay}
    </View>
  )
}

function MediaItemContent({ className, children, ...props }: ViewProps) {
  const { variant } = use(MediaItemContext)
  const { content } = mediaItemStyles({ variant })

  return (
    <View className={cn(content(), className)} {...props}>
      {children}
    </View>
  )
}

function MediaItemTitle({ className, children, ...props }: TextProps) {
  const { variant } = use(MediaItemContext)
  const { title } = mediaItemStyles({ variant })

  return (
    <Text className={cn(title(), className)} numberOfLines={1} {...props}>
      {children}
    </Text>
  )
}

function MediaItemDescription({ className, children, ...props }: TextProps) {
  const { variant } = use(MediaItemContext)
  const { description } = mediaItemStyles({ variant })

  return (
    <Text className={cn(description(), className)} numberOfLines={1} {...props}>
      {children}
    </Text>
  )
}

function MediaItemRank({ className, children, ...props }: TextProps) {
  const { rank } = mediaItemStyles()

  return (
    <Text className={cn(rank(), className)} {...props}>
      {children}
    </Text>
  )
}

function MediaItemAction({
  accessibilityHint,
  accessibilityLabel,
  accessibilityRole,
  children,
  className,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  style,
  testID,
  ...props
}: React.ComponentProps<typeof PressableFeedback>) {
  const isInteractive = Boolean(onPress || onLongPress || onPressIn || onPressOut)

  if (!isInteractive) {
    return (
      <Animated.View
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        className={className}
        // SAFETY: with no press handlers a press-state style callback can never fire, so the prop is effectively static
        style={style as StyleProp<ViewStyle>}
        testID={testID}
      >
        {children}
      </Animated.View>
    )
  }

  return (
    <PressableFeedback
      className={cn("active:opacity-50", className)}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...props}
    >
      {children}
    </PressableFeedback>
  )
}

type MediaItemCompoundComponent = typeof MediaItemRoot & {
  Image: typeof MediaItemImage
  Content: typeof MediaItemContent
  Title: typeof MediaItemTitle
  Description: typeof MediaItemDescription
  Rank: typeof MediaItemRank
  Action: typeof MediaItemAction
}

// SAFETY: subcomponents are attached immediately below; MediaItemCompoundComponent mirrors that exact shape
const MediaItem = MediaItemRoot as MediaItemCompoundComponent
MediaItem.Image = MediaItemImage
MediaItem.Content = MediaItemContent
MediaItem.Title = MediaItemTitle
MediaItem.Description = MediaItemDescription
MediaItem.Rank = MediaItemRank
MediaItem.Action = MediaItemAction

export { MediaItem }

export {
  MediaItemAction,
  MediaItemContent,
  MediaItemDescription,
  MediaItemImage,
  MediaItemRank,
  MediaItemRoot,
  MediaItemTitle,
}
