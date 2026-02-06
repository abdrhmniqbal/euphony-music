import React, { useEffect, useLayoutEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image, LayoutAnimation, Platform, UIManager } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { $tracks, Track } from "@/features/player/player.store";
import { useStore } from "@nanostores/react";
import {
    MAX_PLAYLIST_DESCRIPTION_LENGTH,
    MAX_PLAYLIST_NAME_LENGTH,
} from "@/features/library/create-playlist.service";
import { useCreatePlaylistScreen } from "@/features/library/use-create-playlist";

export default function CreatePlaylistScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const theme = useThemeColors();
    const allTracks = useStore($tracks);

    const {
        name,
        description,
        selectedTracks,
        showTrackPicker,
        canSave,
        selectedTracksList,
        setName,
        setDescription,
        toggleTrack,
        toggleTrackPicker,
        save,
    } = useCreatePlaylistScreen(allTracks, () => router.back());

    function handleCancel() {
        router.back();
    }

    useLayoutEffect(() => {
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
                    onPress={save}
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
    }, [navigation, theme, canSave, save, router]);

    useEffect(() => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    function handleTogglePicker() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        toggleTrackPicker();
    }

    return (
        <View className="flex-1 bg-background">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-4 border-b border-border">
                    <View className="flex-row items-center justify-between">
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Playlist name"
                            placeholderTextColor={theme.muted}
                            className="flex-1 text-2xl font-bold text-foreground"
                            maxLength={MAX_PLAYLIST_NAME_LENGTH}
                        />
                        <Text className="text-muted text-sm ml-2">
                            {name.length}/{MAX_PLAYLIST_NAME_LENGTH}
                        </Text>
                    </View>
                </View>

                <View className="px-4 py-4 border-b border-border">
                    <View className="flex-row items-start justify-between">
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Add a description"
                            placeholderTextColor={theme.muted}
                            className="flex-1 text-base text-foreground"
                            maxLength={MAX_PLAYLIST_DESCRIPTION_LENGTH}
                            multiline
                        />
                        <Text className="text-muted text-sm ml-2">
                            {description.length}/{MAX_PLAYLIST_DESCRIPTION_LENGTH}
                        </Text>
                    </View>
                </View>

                <Pressable
                    onPress={handleTogglePicker}
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
