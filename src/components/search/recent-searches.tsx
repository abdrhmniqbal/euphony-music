import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useThemeColors } from "@/hooks/use-theme-colors";

export interface RecentSearchItem {
    id: string;
    title: string;
    subtitle: string;
    type?: 'song' | 'album' | 'artist' | 'playlist';
}

interface RecentSearchesProps {
    searches: RecentSearchItem[];
    onClear: () => void;
    onItemPress: (item: RecentSearchItem) => void;
    onRemoveItem: (id: string) => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
    searches,
    onClear,
    onItemPress,
    onRemoveItem
}) => {
    const theme = useThemeColors();

    const handleItemPress = (item: RecentSearchItem) => {
        onItemPress(item);
    };

    const handleRemoveItem = (id: string) => {
        onRemoveItem(id);
    };

    const getIconForType = (type?: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'artist': return 'person-outline';
            case 'album': return 'disc-outline';
            case 'playlist': return 'list-outline';
            default: return 'time-outline';
        }
    };

    if (searches.length === 0) {
        return null;
    }

    return (
        <View className="px-4 py-4">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-[17px] font-bold text-muted">Recent Searches</Text>
                <Pressable className="active:opacity-50" onPress={onClear}>
                    <Text className="text-[15px] text-muted">Clear</Text>
                </Pressable>
            </View>
            <View className="gap-2">
                {searches.map((item) => (
                    <Item
                        key={item.id}
                        onPress={() => handleItemPress(item)}
                    >
                        <ItemImage icon={getIconForType(item.type)} />
                        <ItemContent>
                            <ItemTitle>{item.title}</ItemTitle>
                            <ItemDescription>{item.subtitle}</ItemDescription>
                        </ItemContent>
                        <ItemAction className="p-2" onPress={() => handleRemoveItem(item.id)}>
                            <Ionicons name="close" size={20} color={theme.muted} />
                        </ItemAction>
                    </Item>
                ))}
            </View>
        </View>
    );
};
