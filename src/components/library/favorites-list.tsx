import React, { useCallback } from "react";
import { View, Pressable, Image as RNImage } from "react-native";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { playTrack, Track, $tracks } from "@/store/player-store";
import { FavoriteEntry, FavoriteType } from "@/db/operations";
import { useStore } from "@nanostores/react";
import { useRouter } from "expo-router";
import { toggleFavoriteItem } from "@/store/favorites-store";
import { EmptyState } from "@/components/empty-state";

interface FavoritesListProps {
    data: FavoriteEntry[];
    scrollEnabled?: boolean;
}

const GRID_ITEMS = [1, 2, 3, 4] as const;

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
                <ItemImage className="bg-default items-center justify-center overflow-hidden p-1">
                    {favorite.image ? (
                        <View className="w-full h-full rounded-lg overflow-hidden">
                            <RNImage
                                source={{ uri: favorite.image }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap w-full h-full">
                            {GRID_ITEMS.map((i) => (
                                <View key={i} className="w-1/2 h-1/2 p-px">
                                    <View className="w-full h-full bg-muted/20 rounded-sm items-center justify-center">
                                        <Ionicons name="musical-note" size={10} color={theme.muted} style={{ opacity: 0.5 }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
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
            return 'Song';
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
    const theme = useThemeColors();

    return (
        <View
            className="px-2 py-0.5 rounded-full mr-2"
            style={{ backgroundColor: theme.muted + '30' }}
        >
            <ItemDescription className="text-xs font-medium">
                {getTypeLabel(type)}
            </ItemDescription>
        </View>
    );
};

export const FavoritesList: React.FC<FavoritesListProps> = ({ data, scrollEnabled = true }) => {
    const theme = useThemeColors();
    const tracks = useStore($tracks);
    const router = useRouter();

    if (data.length === 0) {
        return <EmptyState icon="heart" title="No Favorites" message="Your favorite songs, artists, and albums will appear here." />;
    }

    const handlePress = useCallback((favorite: FavoriteEntry) => {
        switch (favorite.type) {
            case 'track':
                const track = tracks.find(t => t.id === favorite.id);
                if (track) {
                    playTrack(track);
                }
                break;
            case 'artist':
                router.push(`/artist/${encodeURIComponent(favorite.name)}`);
                break;
            case 'album':
                router.push(`/album/${encodeURIComponent(favorite.name)}`);
                break;
            case 'playlist':
                break;
        }
    }, [tracks, router]);

    const handleRemoveFavorite = useCallback((favorite: FavoriteEntry) => {
        toggleFavoriteItem(favorite.id, favorite.type, favorite.name);
    }, []);

    const renderFavoriteItem = useCallback((item: FavoriteEntry) => (
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
    ), [handlePress, handleRemoveFavorite]);

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
