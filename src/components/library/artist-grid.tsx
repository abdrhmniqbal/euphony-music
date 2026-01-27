import React from "react";
import { View } from "react-native";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription } from "@/components/item";

export type Artist = {
    name: string;
    tracks: string;
};

export const ArtistGrid = ({ data }: { data: Artist[] }) => {
    return (
        <View className="flex-row flex-wrap gap-4">
            {data.map((artist, index) => (
                <Item
                    key={index}
                    variant="grid"
                    className="w-[30%] grow"
                    onPress={() => { }}
                >
                    <ItemImage icon="person" className="w-full aspect-square rounded-full bg-default" />
                    <ItemContent className="mt-1 items-center">
                        <ItemTitle className="text-sm text-center normal-case" numberOfLines={1}>{artist.name}</ItemTitle>
                        <ItemDescription className="text-center">{artist.tracks}</ItemDescription>
                    </ItemContent>
                </Item>
            ))}
        </View>
    );
};
