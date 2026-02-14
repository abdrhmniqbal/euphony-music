import React from "react";
import { View, Pressable, Image as RNImage } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState, Item, ItemAction, ItemContent, ItemDescription, ItemImage, ItemTitle } from "@/components/ui";
import { PlaylistArtwork } from "@/components/patterns";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { playTrack, $tracks } from "@/modules/player/player.store";
import type { FavoriteEntry, FavoriteType } from "@/modules/favorites/favorites.store";
import { useStore } from "@nanostores/react";
import { useRouter } from "expo-router";
import { toggleFavoriteItem } from "@/modules/favorites/favorites.store";

interface FavoritesListProps {
    data: FavoriteEntry[];
    scrollEnabled?: boolean;
}

const FavoriteItemImage: React.FC<{ favorite: FavoriteEntry }> = ({ favorite }) => {
    const theme = useThemeColors();

    switch (favorite.type) {
        case 'artist':
            return (
                <ItemImage className="rounded-full overflow-hidden">
                    {favorite.image ? (
                        <RNImage
                            source={{ uri: favorite.image }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full bg-default items-center justify-center rounded-full">
                            <Ionicons name="person" size={24} color={theme.muted} />
                        </View>
                    )}
                </ItemImage>
            );

        case 'playlist':
            return (
                <ItemImage className="bg-default items-center justify-center overflow-hidden">
                    <PlaylistArtwork
                        images={
                            favorite.images && favorite.images.length > 0
                                ? favorite.images
                                : favorite.image
                                  ? [favorite.image]
                                  : undefined
                        }
                    />
                </ItemImage>
            );

        case 'album':
            return (
                <ItemImage
                    icon="disc"
                    image={favorite.image}
                    className="rounded-lg"
                />
            );

        case 'track':
        default:
            return (
                <ItemImage
                    icon="musical-note"
                    image={favorite.image}
                />
            );
    }
};

const getTypeLabel = (type: FavoriteType): string => {
    switch (type) {
        case 'track':
            return 'Track';
        case 'artist':
            return 'Artist';
        case 'album':
            return 'Album';
        case 'playlist':
            return 'Playlist';
        default:
            return type;
    }
};

const TypeBadge: React.FC<{ type: FavoriteType }> = ({ type }) => {
    return (
        <View className="mr-2 rounded-full bg-muted/20 px-2 py-0.5">
            <ItemDescription className="text-xs font-medium">
                {getTypeLabel(type)}
            </ItemDescription>
        </View>
    );
};

export const FavoritesList: React.FC<FavoritesListProps> = ({ data, scrollEnabled = true }) => {
    const tracks = useStore($tracks);
    const router = useRouter();

    if (data.length === 0) {
        return <EmptyState icon="heart" title="No Favorites" message="Your favorite tracks, artists, and albums will appear here." />;
    }

    const handlePress = (favorite: FavoriteEntry) => {
        switch (favorite.type) {
            case 'track':
                const track = tracks.find(t => t.id === favorite.id);
                if (track) {
                    playTrack(track);
                }
                break;
            case 'artist':
                router.push(`./artist/${encodeURIComponent(favorite.name)}`);
                break;
            case 'album':
                router.push(`./album/${encodeURIComponent(favorite.name)}`);
                break;
            case 'playlist':
                router.push(`./playlist/${favorite.id}`);
                break;
        }
    };

    const handleRemoveFavorite = (favorite: FavoriteEntry) => {
        void toggleFavoriteItem(favorite.id, favorite.type, favorite.name);
    };

    const renderFavoriteItem = (item: FavoriteEntry) => (
        <Item
            key={item.id}
            onPress={() => handlePress(item)}
        >
            <FavoriteItemImage favorite={item} />
            <ItemContent>
                <ItemTitle>{item.name}</ItemTitle>
                <View className="flex-row items-center">
                    <TypeBadge type={item.type} />
                    <ItemDescription>{item.subtitle || ""}</ItemDescription>
                </View>
            </ItemContent>
            <ItemAction>
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(item);
                    }}
                    className="p-2 active:opacity-50"
                >
                    <Ionicons name="heart" size={22} color="#ef4444" />
                </Pressable>
            </ItemAction>
        </Item>
    );

    if (!scrollEnabled) {
        return (
            <View style={{ gap: 8 }}>
                {data.map(renderFavoriteItem)}
            </View>
        );
    }

    return (
        <LegendList
            data={data}
            renderItem={({ item }: LegendListRenderItemProps<FavoriteEntry>) => renderFavoriteItem(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8 }}
            recycleItems={true}
            estimatedItemSize={72}
            drawDistance={250}
            style={{ flex: 1 }}
        />
    );
};
