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

const DEFAULT_LONG_PRESS_DELAY_MS = 500

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

type MaybeShared<T> = T | SharedValue<T | null | undefined> | null | undefined

// SAFETY: heroui accepts SharedValue handlers; only plain functions can be re-emitted through our own wrapper
function resolvePlainHandler<T>(handler: MaybeShared<T>): T | undefined {
  if (!handler || isSharedValue(handler)) return undefined
  // SAFETY: isSharedValue guard above excludes the SharedValue branch of MaybeShared
  return handler as T
}

/**
 * Deterministic long-press activation layered on top of PressableFeedback.
 * A timer armed on press-in fires onLongPress even when native gesture
 * detection is swallowed by ripple/boundary wrappers; onPress is suppressed
 * for the press that activated it.
 */
function useMediaItemInteraction(
  handlers: {
    onPress?: MaybeShared<(event: GestureResponderEvent) => void>
    onLongPress?: MaybeShared<(event: GestureResponderEvent) => void>
    onPressIn?: MaybeShared<(event: GestureResponderEvent) => void>
    onPressOut?: MaybeShared<(event: GestureResponderEvent) => void>
  },
  delayLongPressMs: number
) {
  const onPress = resolvePlainHandler(handlers.onPress)
  const onLongPress = resolvePlainHandler(handlers.onLongPress)
  const onPressIn = resolvePlainHandler(handlers.onPressIn)
  const onPressOut = resolvePlainHandler(handlers.onPressOut)

  const didActivateRef = React.useRef(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  React.useEffect(() => stopTimer, [stopTimer])

  const handlePressIn = React.useCallback(
    (event: GestureResponderEvent) => {
      didActivateRef.current = false
      onPressIn?.(event)
      if (!onLongPress) return
      stopTimer()
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        if (didActivateRef.current) return
        didActivateRef.current = true
        onLongPress(event)
      }, delayLongPressMs)
    },
    [delayLongPressMs, onLongPress, onPressIn, stopTimer]
  )

  const handlePressOut = React.useCallback(
    (event: GestureResponderEvent) => {
      stopTimer()
      onPressOut?.(event)
    },
    [onPressOut, stopTimer]
  )

  const handlePress = React.useCallback(
    (event: GestureResponderEvent) => {
      if (didActivateRef.current) {
        didActivateRef.current = false
        return
      }
      onPress?.(event)
    },
    [onPress]
  )

  const handleNativeLongPress = React.useCallback(
    (event: GestureResponderEvent) => {
      if (didActivateRef.current || !onLongPress) return
      stopTimer()
      didActivateRef.current = true
      onLongPress(event)
    },
    [onLongPress, stopTimer]
  )

  return { handlePress, handleNativeLongPress, handlePressIn, handlePressOut }
}

interface MediaItemRootProps
  extends React.ComponentProps<typeof PressableFeedback>, MediaItemVariant {
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
  delayLongPress = DEFAULT_LONG_PRESS_DELAY_MS,
  ...props
}: MediaItemRootProps) {
  const { base } = mediaItemStyles({ variant })
  const resolvedDelay =
    delayLongPress && !isSharedValue<number | null | undefined>(delayLongPress)
      ? delayLongPress
      : DEFAULT_LONG_PRESS_DELAY_MS

  const interaction = useMediaItemInteraction(
    { onPress, onLongPress, onPressIn, onPressOut },
    resolvedDelay
  )

  const interactionProps = {
    ...props,
    onPress: interaction.handlePress,
    onLongPress: interaction.handleNativeLongPress,
    onPressIn: interaction.handlePressIn,
    onPressOut: interaction.handlePressOut,
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

interface MediaItemImageProps extends ViewProps {
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
  const hasPlainHandlers =
    !!resolvePlainHandler(onPress) ||
    !!resolvePlainHandler(onLongPress) ||
    !!resolvePlainHandler(onPressIn) ||
    !!resolvePlainHandler(onPressOut)

  if (!hasPlainHandlers) {
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
