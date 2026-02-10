import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/ui";
import { playTrack, Track } from "@/modules/player/player.store";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { cn } from "tailwind-variants";

const SEARCH_TABS = ["All", "Track", "Album", "Artist", "Playlist"] as const;
type SearchTab = typeof SEARCH_TABS[number];

interface ArtistResult {
    id: string;
    name: string;
    type: string;
    followerCount: number;
    isVerified: boolean;
    image?: string;
}

interface AlbumResult {
    id: string;
    title: string;
    artist: string;
    isVerified: boolean;
    image?: string;
}

interface SearchResultsProps {
    tracks: Track[];
    query: string;
    onArtistPress?: (artist: ArtistResult) => void;
    onAlbumPress?: (album: AlbumResult) => void;
    onSeeMoreTracks?: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
    tracks,
    query,
    onArtistPress,
    onAlbumPress,
    onSeeMoreTracks,
}) => {
    const theme = useThemeColors();
    const [activeTab, setActiveTab] = useState<SearchTab>("All");

    const filteredTracks = (() => {
        if (!query.trim()) return tracks.slice(0, 5);
        const lowerQuery = query.toLowerCase();
        return tracks
            .filter(t =>
                t.title.toLowerCase().includes(lowerQuery) ||
                (t.artist?.toLowerCase().includes(lowerQuery))
            )
            .slice(0, 5);
    })();

    const artists: ArtistResult[] = (() => {
        const artistMap = new Map<string, ArtistResult>();
        tracks.forEach(track => {
            const artistName = track.artist || "Unknown Artist";
            if (!artistMap.has(artistName) &&
                (!query.trim() || artistName.toLowerCase().includes(query.toLowerCase()))) {
                artistMap.set(artistName, {
                    id: artistName,
                    name: artistName,
                    type: "Artist",
                    followerCount: 0,
                    isVerified: false,
                    image: track.image,
                });
            }
        });
        return Array.from(artistMap.values()).slice(0, 1);
    })();

    const albums: AlbumResult[] = (() => {
        const albumMap = new Map<string, AlbumResult>();
        tracks.forEach(track => {
            const albumName = track.album || "Unknown Album";
            if (!albumMap.has(albumName) &&
                (!query.trim() || albumName.toLowerCase().includes(query.toLowerCase()))) {
                albumMap.set(albumName, {
                    id: albumName,
                    title: albumName,
                    artist: track.artist || "Unknown Artist",
                    isVerified: false,
                    image: track.image,
                });
            }
        });
        return Array.from(albumMap.values()).slice(0, 4);
    })();

    const handleTrackPress = (track: Track) => {
        playTrack(track);
    };

    const formatFollowerCount = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
        return count.toString();
    };

    const showArtists = activeTab === 'All' || activeTab === 'Artist';
    const showAlbums = activeTab === 'All' || activeTab === 'Album' || activeTab === 'Playlist';
    const showTracks = activeTab === 'All' || activeTab === 'Track';

    return (
        <View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                className="py-4"
            >
                {SEARCH_TABS.map((tab) => (
                    <Pressable
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={cn("rounded-full px-4 py-1.5", activeTab === tab ? "bg-accent" : "bg-transparent")}
                    >
                        <Text className={cn("font-medium", activeTab === tab ? "text-white" : "text-muted")}>
                            {tab}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <View className="px-4 gap-8">
                {showArtists && artists.length > 0 && (
                    <View>
                        {artists.map((artist) => (
                            <Item
                                key={artist.id}
                                variant="list"
                                className="py-1"
                                onPress={() => onArtistPress?.(artist)}
                            >
                                <ItemImage
                                    icon="person"
                                    image={artist.image}
                                    className="rounded-full w-14 h-14 bg-default"
                                />
                                <ItemContent>
                                    <ItemTitle className="text-lg">{artist.name}</ItemTitle>
                                    <View className="flex-row items-center gap-1">
                                        <Text className="text-xs text-muted">{artist.type}</Text>
                                        {artist.followerCount > 0 && (
                                            <Text className="text-xs text-muted">♥ {formatFollowerCount(artist.followerCount)}</Text>
                                        )}
                                    </View>
                                </ItemContent>
                            </Item>
                        ))}
                    </View>
                )}

                {showAlbums && albums.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
                        <View className="flex-row gap-4">
                            {albums.map((album) => (
                                <Item
                                    key={album.id}
                                    variant="grid"
                                    className="w-32"
                                    onPress={() => onAlbumPress?.(album)}
                                >
                                    <ItemImage icon="disc" image={album.image} className="rounded-md" />
                                    <ItemContent className="mt-1">
                                        <ItemTitle className="text-sm normal-case" numberOfLines={2}>
                                            {album.title}
                                        </ItemTitle>
                                        <View className="flex-row items-center gap-1">
                                            <Text className="text-xs text-muted" numberOfLines={1}>
                                                {album.artist}
                                            </Text>
                                            {album.isVerified && (
                                                <Ionicons name="checkmark-circle" size={12} color={theme.accent} />
                                            )}
                                        </View>
                                    </ItemContent>
                                </Item>
                            ))}
                        </View>
                    </ScrollView>
                )}

                {showTracks && filteredTracks.length > 0 && (
                    <View>
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-lg font-bold text-foreground">Tracks</Text>
                            {onSeeMoreTracks && (
                                <Pressable onPress={onSeeMoreTracks}>
                                    <Text className="text-xs text-muted">See more</Text>
                                </Pressable>
                            )}
                        </View>
                        <View className="gap-2">
                            {filteredTracks.map((track) => (
                                <Item
                                    key={track.id}
                                    onPress={() => handleTrackPress(track)}
                                >
                                    <ItemImage icon="musical-note" image={track.image} className="rounded-md" />
                                    <ItemContent>
                                        <ItemTitle>{track.title}</ItemTitle>
                                        <ItemDescription>{track.artist || "Unknown Artist"}</ItemDescription>
                                    </ItemContent>
                                    <ItemAction>
                                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.muted} />
                                    </ItemAction>
                                </Item>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};
