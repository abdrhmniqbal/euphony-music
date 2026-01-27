import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";

export type Folder = {
    name: string;
    count: string;
};

export const FolderList = ({ data }: { data: Folder[] }) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    return (
        <View className="gap-2">
            {data.map((folder, index) => (
                <Item
                    key={index}
                    onPress={() => { }}
                >
                    <ItemImage icon="folder-outline" />
                    <ItemContent>
                        <ItemTitle>{folder.name}</ItemTitle>
                        <ItemDescription>{folder.count}</ItemDescription>
                    </ItemContent>
                    <ItemAction>
                        <Ionicons name="chevron-forward" size={24} color={theme.muted} />
                    </ItemAction>
                </Item>
            ))}
        </View>
    );
};
