import React from "react";
import { View } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";

export type Album = {
    title: string;
    artist: string;
};

export const AlbumGrid = ({ data }: { data: Album[] }) => {
    return (
        <View className="flex-row flex-wrap gap-4">
            {data.map((album, index) => (
                <Item
                    key={index}
                    variant="grid"
                    className="w-[30%] grow"
                    onPress={() => { }}
                >
                    <ItemImage icon="musical-note" className="w-full aspect-square rounded-md" />
                    <ItemContent className="mt-1">
                        <ItemTitle className="text-sm normal-case" numberOfLines={1}>{album.title}</ItemTitle>
                        <ItemDescription>{album.artist}</ItemDescription>
                    </ItemContent>
                </Item>
            ))}
        </View>
    );
};
