import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image, LayoutAnimation, Platform, UIManager } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { $tracks, Track } from "@/store/player-store";
import { useStore } from "@nanostores/react";
import { useCreatePlaylist } from "@/features/library/api/use-library";

const MAX_NAME_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 40;

export default function CreatePlaylistScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const theme = useThemeColors();
    const allTracks = useStore($tracks);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
    const [showTrackPicker, setShowTrackPicker] = useState(false);

    const createPlaylistMutation = useCreatePlaylist();
    const [isSaving, setIsSaving] = useState(false);

    const handleCancel = () => {
        router.back();
    };

    const handleSave = async () => {
        if (!name.trim() || isSaving) return;

        setIsSaving(true);
        try {
            await createPlaylistMutation.mutateAsync({
                name,
                description,
                trackIds: Array.from(selectedTracks)
            });
            router.back();
        } catch (error) {
            console.error(error);
            setIsSaving(false);
        }
    };

    const toggleTrack = useCallback((trackId: string) => {
        setSelectedTracks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(trackId)) {
                newSet.delete(trackId);
            } else {
                newSet.add(trackId);
            }
            return newSet;
        });
    }, []);

    const selectedTracksList = useMemo(() => {
        return allTracks.filter(t => selectedTracks.has(t.id));
    }, [allTracks, selectedTracks]);

    const canSave = name.trim().length > 0;

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: "Create Playlist",
            headerTitleAlign: 'center',
            headerLeft: () => (
                <Pressable onPress={handleCancel} className="pl-4 py-2 active:opacity-50">
                    <Ionicons name="close" size={24} color={theme.foreground} />
                </Pressable>
            ),
            headerRight: () => (
                <Pressable
                    onPress={handleSave}
                    className="pr-4 py-2 active:opacity-50"
                    disabled={!canSave}
                >
                    <Ionicons
                        name="checkmark"
                        size={24}
                        color={canSave ? theme.accent : theme.muted}
                    />
                </Pressable>
            ),
        });
    }, [navigation, theme, canSave, handleSave, handleCancel]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);

    return (
        <View className="flex-1 bg-background">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-4 border-b border-border">
                    <View className="flex-row items-center justify-between">
                        <TextInput
                            value={name}
                            onChangeText={(text) => setName(text.slice(0, MAX_NAME_LENGTH))}
                            placeholder="Playlist name"
                            placeholderTextColor={theme.muted}
                            className="flex-1 text-2xl font-bold text-foreground"
                            maxLength={MAX_NAME_LENGTH}
                        />
                        <Text className="text-muted text-sm ml-2">
                            {name.length}/{MAX_NAME_LENGTH}
                        </Text>
                    </View>
                </View>

                <View className="px-4 py-4 border-b border-border">
                    <View className="flex-row items-start justify-between">
                        <TextInput
                            value={description}
                            onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))}
                            placeholder="Add a description"
                            placeholderTextColor={theme.muted}
                            className="flex-1 text-base text-foreground"
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            multiline
                        />
                        <Text className="text-muted text-sm ml-2">
                            {description.length}/{MAX_DESCRIPTION_LENGTH}
                        </Text>
                    </View>
                </View>

                <Pressable
                    onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setShowTrackPicker(!showTrackPicker);
                    }}
                    className="flex-row items-center justify-between px-4 py-4 border-b border-border active:bg-default"
                >
                    <Text className="text-accent text-base font-medium">Add Songs</Text>
                    <Ionicons
                        name={showTrackPicker ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={theme.muted}
                    />
                </Pressable>

                {showTrackPicker && (
                    <View className="border-b border-border">
                        {allTracks.slice(0, 50).map((track) => (
                            <TrackItem
                                key={track.id}
                                track={track}
                                isSelected={selectedTracks.has(track.id)}
                                onToggle={() => toggleTrack(track.id)}
                                theme={theme}
                            />
                        ))}
                    </View>
                )}

                {selectedTracksList.length > 0 && !showTrackPicker && (
                    <View className="mt-4">
                        <Text className="px-4 text-muted text-sm mb-2">
                            {selectedTracksList.length} {selectedTracksList.length === 1 ? 'song' : 'songs'} selected
                        </Text>
                        {selectedTracksList.map((track) => (
                            <TrackItem
                                key={track.id}
                                track={track}
                                isSelected={true}
                                onToggle={() => toggleTrack(track.id)}
                                theme={theme}
                                showDragHandle
                            />
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

interface TrackItemProps {
    track: Track;
    isSelected: boolean;
    onToggle: () => void;
    theme: ReturnType<typeof useThemeColors>;
    showDragHandle?: boolean;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, isSelected, onToggle, theme, showDragHandle }) => (
    <Pressable
        onPress={onToggle}
        className="flex-row items-center px-4 py-3 active:bg-default"
    >
        <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${isSelected ? 'bg-accent border-accent' : 'border-muted'
            }`}>
            {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
        </View>

        <View className="w-12 h-12 rounded-lg overflow-hidden bg-default mr-3">
            {track.image ? (
                <Image source={{ uri: track.image }} className="w-full h-full" resizeMode="cover" />
            ) : (
                <View className="w-full h-full items-center justify-center">
                    <Ionicons name="musical-note" size={20} color={theme.muted} />
                </View>
            )}
        </View>

        <View className="flex-1">
            <Text className="text-foreground font-medium" numberOfLines={1}>
                {track.title}
            </Text>
            <Text className="text-muted text-sm" numberOfLines={1}>
                {track.artist || "Unknown Artist"}
            </Text>
        </View>

        {showDragHandle && (
            <Ionicons name="reorder-three" size={24} color={theme.muted} />
        )}
    </Pressable>
);
