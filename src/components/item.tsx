import React, { createContext, useContext } from 'react';
import { View, Text, Pressable, ViewProps, PressableProps, TextProps } from 'react-native';
import { tv, type VariantProps } from 'tailwind-variants';
import { Card } from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
import { useUniwind } from 'uniwind';
import { Colors } from '@/constants/colors';

const itemStyles = tv({
    slots: {
        base: "bg-transparent border-none",
        imageContainer: "bg-default rounded-lg items-center justify-center overflow-hidden",
        content: "flex-1 justify-center gap-0.5",
        title: "font-bold text-foreground",
        description: "text-xs text-muted",
    },
    variants: {
        variant: {
            list: {
                base: "py-2.5 flex-row items-center gap-3 bg-transparent",
                imageContainer: "w-14 h-14",
                title: "text-base font-bold",
            },
            grid: {
                base: "w-36 gap-2",
                imageContainer: "w-full aspect-square",
                content: "w-full",
                title: "text-base uppercase leading-tight",
            }
        }
    },
    defaultVariants: {
        variant: 'list'
    }
});

type ItemVariant = VariantProps<typeof itemStyles>;
type ItemContextType = ItemVariant & { theme: any };

const ItemContext = createContext<ItemContextType>({ variant: 'list', theme: {} });

type ItemProps = PressableProps & ItemVariant & {
    asChild?: boolean;
};

const Item = React.forwardRef<View, ItemProps>(({ className, variant = 'list', children, ...props }, ref) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const { base } = itemStyles({ variant });

    return (
        <ItemContext.Provider value={{ variant, theme }}>
            <Pressable
                ref={ref as any}
                className={base({ className })}
                {...props}
            >
                {children}
            </Pressable>
        </ItemContext.Provider>
    );
});
Item.displayName = "Item";

type ItemImageProps = ViewProps & {
    icon?: keyof typeof Ionicons.glyphMap;
    // We could add source prop for Image later if needed
};

const ItemImage = React.forwardRef<View, ItemImageProps>(({ className, icon, children, ...props }, ref) => {
    const { variant, theme } = useContext(ItemContext);
    const { imageContainer } = itemStyles({ variant });

    return (
        <View ref={ref} className={imageContainer({ className })} {...props}>
            {icon ? (
                <Ionicons
                    name={icon}
                    size={variant === 'list' ? 24 : 48}
                    color={theme.foreground}
                />
            ) : (
                children
            )}
        </View>
    );
});
ItemImage.displayName = "ItemImage";

const ItemContent = React.forwardRef<View, ViewProps>(({ className, children, ...props }, ref) => {
    const { variant } = useContext(ItemContext);
    const { content } = itemStyles({ variant });

    return (
        <View ref={ref} className={content({ className })} {...props}>
            {children}
        </View>
    );
});
ItemContent.displayName = "ItemContent";

const ItemTitle = React.forwardRef<Text, TextProps>(({ className, children, ...props }, ref) => {
    const { variant } = useContext(ItemContext);
    const { title } = itemStyles({ variant });

    return (
        <Text ref={ref} className={title({ className })} numberOfLines={1} {...props}>
            {children}
        </Text>
    );
});
ItemTitle.displayName = "ItemTitle";

const ItemDescription = React.forwardRef<Text, TextProps>(({ className, children, ...props }, ref) => {
    const { variant } = useContext(ItemContext);
    const { description } = itemStyles({ variant });

    return (
        <Text ref={ref} className={description({ className })} numberOfLines={1} {...props}>
            {children}
        </Text>
    );
});
ItemDescription.displayName = "ItemDescription";

// New component for Rank
const ItemRank = React.forwardRef<Text, TextProps>(({ className, children, ...props }, ref) => {
    // Only show rank in list view usually, but we'll let consumer decide or hide via styles
    // In MusicCard, rank had specific styles: "text-lg font-bold text-foreground w-8 text-center"
    const { theme } = useContext(ItemContext);

    return (
        <Text
            ref={ref}
            className={`text-lg font-bold text-foreground w-8 text-center ${className}`}
            {...props}
        >
            {children}
        </Text>
    );
});
ItemRank.displayName = "ItemRank";

const ItemAction = React.forwardRef<View, PressableProps>((props, ref) => {
    // Action usually is a Pressable or View depending on content
    return (
        <Pressable ref={ref as any} className="active:opacity-50" {...props} />
    );
});
ItemAction.displayName = "ItemAction";

export { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemRank, ItemAction };
