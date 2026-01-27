import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";

export type Playlist = {
    title: string;
    count: string;
};

export const PlaylistList = ({ data }: { data: Playlist[] }) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    return (
        <View className="gap-2">
            <Item onPress={() => console.log("Create Playlist")}>
                <ItemImage className="bg-default items-center justify-center">
                    <Ionicons name="add" size={32} color={theme.foreground} />
                </ItemImage>
                <ItemContent>
                    <ItemTitle>New Playlist</ItemTitle>
                </ItemContent>
            </Item>
            {data.map((playlist, index) => (
                <Item
                    key={index}
                    onPress={() => { }}
                >
                    <ItemImage className="bg-default items-center justify-center overflow-hidden p-1">
                        <View className="flex-row flex-wrap w-full h-full">
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} className="w-1/2 h-1/2 p-px">
                                    <View className="w-full h-full bg-muted/20 rounded-sm items-center justify-center">
                                        <Ionicons name="musical-note" size={10} color={theme.muted} style={{ opacity: 0.5 }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ItemImage>
                    <ItemContent>
                        <ItemTitle>{playlist.title}</ItemTitle>
                        <ItemDescription>{playlist.count}</ItemDescription>
                    </ItemContent>
                    <ItemAction>
                        <Ionicons name="chevron-forward" size={24} color={theme.muted} />
                    </ItemAction>
                </Item>
            ))}
        </View>
    );
};
