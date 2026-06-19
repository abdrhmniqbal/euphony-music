/**
 * Purpose: Provides shared media row primitives for list and grid item layouts.
 * Caller: Library lists, search results, favorites, recent searches, playlists, and folder rows.
 * Dependencies: HeroUI Native press feedback, Expo Image, screen transition boundaries, Tailwind variants.
 * Main Functions: MediaItem, MediaItemRoot, MediaItemImage, MediaItemContent, MediaItemAction.
 * Side Effects: Handles user press interactions and transition boundary registration.
 */

import type { ReactNode } from "react"
import { Image } from "expo-image"
import { PressableFeedback } from "heroui-native"
import * as React from "react"
import { createContext, use } from "react"
import { Text, type TextProps, View, type ViewProps, type GestureResponderEvent } from "react-native"
import Animated from "react-native-reanimated"
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
  children,
  id,
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
  const resolvedDelayLongPress = typeof delayLongPress === "number" ? delayLongPress : 500

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
      if (typeof onLongPress === "function") {
        onLongPress(event)
      }
    },
    [onLongPress]
  )

  const handlePressIn = React.useCallback(
    (event: GestureResponderEvent) => {
      didLongPressRef.current = false
      if (typeof onPressIn === "function") {
        onPressIn(event)
      }
      if (typeof onLongPress !== "function") {
        return
      }
      clearLongPressTimer()
      longPressTimerRef.current = setTimeout(() => {
        triggerLongPress(event)
      }, resolvedDelayLongPress)
    },
    [clearLongPressTimer, onLongPress, onPressIn, resolvedDelayLongPress, triggerLongPress]
  )

  const handlePressOut = React.useCallback(
    (event: GestureResponderEvent) => {
      clearLongPressTimer()
      if (typeof onPressOut === "function") {
        onPressOut(event)
      }
    },
    [clearLongPressTimer, onPressOut]
  )

  const handlePress = React.useCallback(
    (event: GestureResponderEvent) => {
      if (didLongPressRef.current) {
        didLongPressRef.current = false
        return
      }
      if (typeof onPress === "function") {
        onPress(event)
      }
    },
    [onPress]
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
          id={boundaryId}
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
  const staticStyle = typeof style === "function" ? undefined : style

  if (!isInteractive) {
    return (
      <Animated.View
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        className={className}
        style={staticStyle}
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
