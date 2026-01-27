import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { playTrack } from "@/store/player-store";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";

type RecentSearchItem = {
    id: string;
    title: string;
    subtitle: string;
};

type RecentSearchesProps = {
    searches: RecentSearchItem[];
    onClear: () => void;
    onItemPress: (item: RecentSearchItem) => void;
    onRemoveItem: (id: string) => void;
};

export const RecentSearches = ({ searches, onClear, onItemPress, onRemoveItem }: RecentSearchesProps) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

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
                        onPress={() => onItemPress(item)}
                    >
                        <ItemImage icon="time-outline" />
                        <ItemContent>
                            <ItemTitle>{item.title}</ItemTitle>
                            <ItemDescription>{item.subtitle}</ItemDescription>
                        </ItemContent>
                        <ItemAction className="p-2" onPress={() => onRemoveItem(item.id)}>
                            <Ionicons name="close" size={20} color={theme.muted} />
                        </ItemAction>
                    </Item>
                ))}
            </View>
        </View>
    );
};
