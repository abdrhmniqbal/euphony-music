import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { playTrack } from "@/store/player-store";

export type Song = {
    title: string;
    artist: string;
};

export const SongList = ({ data }: { data: Song[] }) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    return (
        <View className="gap-2">
            {data.map((music, index) => (
                <Item
                    key={index}
                    onPress={() => playTrack({ title: music.title, subtitle: music.artist })}
                >
                    <ItemImage icon="musical-note" />
                    <ItemContent>
                        <ItemTitle>{music.title}</ItemTitle>
                        <ItemDescription>{music.artist}</ItemDescription>
                    </ItemContent>
                    <ItemAction>
                        <Ionicons name="ellipsis-horizontal" size={24} color={theme.muted} />
                    </ItemAction>
                </Item>
            ))}
        </View>
    );
};
