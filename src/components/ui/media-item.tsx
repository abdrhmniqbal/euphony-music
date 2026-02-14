import { Ionicons } from "@expo/vector-icons";
import React, { createContext, useContext, type ReactNode } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  type PressableProps,
  type TextProps,
  type ViewProps,
} from "react-native";
import { cn, tv, type VariantProps } from "tailwind-variants";
import { useThemeColors } from "@/hooks/use-theme-colors";

const mediaItemStyles = tv({
  slots: {
    base: "border-none bg-transparent",
    imageContainer: "items-center justify-center overflow-hidden rounded-lg bg-default",
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
        title: "text-base uppercase leading-tight",
      },
    },
  },
  defaultVariants: {
    variant: "list",
  },
});

type MediaItemVariant = VariantProps<typeof mediaItemStyles>;

type MediaItemContextValue = {
  variant: NonNullable<MediaItemVariant["variant"]>;
};

const MediaItemContext = createContext<MediaItemContextValue>({
  variant: "list",
});

type MediaItemProps = PressableProps & MediaItemVariant;

function MediaItemRoot({
  className,
  variant = "list",
  children,
  ...props
}: MediaItemProps) {
  const { base } = mediaItemStyles({ variant });

  return (
    <MediaItemContext.Provider value={{ variant }}>
      <Pressable className={cn(base(), className)} {...props}>
        {children}
      </Pressable>
    </MediaItemContext.Provider>
  );
}

type MediaItemImageProps = ViewProps & {
  icon?: keyof typeof Ionicons.glyphMap | ReactNode;
  image?: string;
};

function MediaItemImage({ className, icon, image, children, ...props }: MediaItemImageProps) {
  const { variant } = useContext(MediaItemContext);
  const theme = useThemeColors();
  const { imageContainer } = mediaItemStyles({ variant });

  return (
    <View className={cn(imageContainer(), className)} {...props}>
      {image ? (
        <View className="h-full w-full overflow-hidden rounded-lg">
          <Image source={{ uri: image }} className="h-full w-full" style={{ width: "100%", height: "100%" }} />
        </View>
      ) : icon ? (
        typeof icon === "string" ? (
          <Ionicons name={icon} size={variant === "list" ? 24 : 48} color={theme.foreground} />
        ) : (
          icon
        )
      ) : (
        children
      )}
    </View>
  );
}

function MediaItemContent({ className, children, ...props }: ViewProps) {
  const { variant } = useContext(MediaItemContext);
  const { content } = mediaItemStyles({ variant });

  return (
    <View className={cn(content(), className)} {...props}>
      {children}
    </View>
  );
}

function MediaItemTitle({ className, children, ...props }: TextProps) {
  const { variant } = useContext(MediaItemContext);
  const { title } = mediaItemStyles({ variant });

  return (
    <Text className={cn(title(), className)} numberOfLines={1} {...props}>
      {children}
    </Text>
  );
}

function MediaItemDescription({ className, children, ...props }: TextProps) {
  const { variant } = useContext(MediaItemContext);
  const { description } = mediaItemStyles({ variant });

  return (
    <Text className={cn(description(), className)} numberOfLines={1} {...props}>
      {children}
    </Text>
  );
}

function MediaItemRank({ className, children, ...props }: TextProps) {
  const { rank } = mediaItemStyles();

  return (
    <Text className={cn(rank(), className)} {...props}>
      {children}
    </Text>
  );
}

function MediaItemAction({ className, ...props }: PressableProps) {
  return <Pressable className={cn("active:opacity-50", className)} {...props} />;
}

export const MediaItem = Object.assign(MediaItemRoot, {
  Image: MediaItemImage,
  Content: MediaItemContent,
  Title: MediaItemTitle,
  Description: MediaItemDescription,
  Rank: MediaItemRank,
  Action: MediaItemAction,
});

export {
  MediaItemRoot,
  MediaItemImage,
  MediaItemContent,
  MediaItemTitle,
  MediaItemDescription,
  MediaItemRank,
  MediaItemAction,
};
