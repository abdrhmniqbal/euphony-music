import React, { useState, useLayoutEffect } from "react";
import { Text, View, ScrollView, Pressable, TextInput } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { playTrack } from "@/store/player-store";
import { SearchResults } from "@/components/search/search-results";
import { RecentSearches } from "@/components/search/recent-searches";

export default function SearchInteractionScreen() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const navigation = useNavigation();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: 'Search',
            headerTitle: () => (
                <View className="flex-1 mr-2">
                    <View className="bg-default/50 rounded-xl flex-row items-center px-3 h-10 border border-default/50">
                        <Ionicons name="search-outline" size={18} color={theme.muted} />
                        <TextInput
                            autoFocus
                            placeholder="Artists, songs, lyrics..."
                            placeholderTextColor={theme.muted}
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                setIsSearching(text.length > 0);
                            }}
                            className="flex-1 text-[16px] text-foreground font-medium"
                            selectionColor={theme.accent}
                        />
                    </View>
                </View>
            ),
            headerBackVisible: false,
            headerLeft: () => null,
            headerRight: () => (
                <Pressable onPress={() => router.back()} className="mr-1 active:opacity-50">
                    <Text className="text-[17px] font-semibold text-muted">Cancel</Text>
                </Pressable>
            ),
            headerStyle: {
                backgroundColor: theme.background,
            },
            headerShadowVisible: false,
        });
    }, [navigation, theme, searchQuery]);

    const recentSearches = [
        { id: '1', title: "Midnight City", subtitle: "M83" },
        { id: '2', title: "Starboy", subtitle: "The Weeknd" },
    ];

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 160 }}
                keyboardShouldPersistTaps="handled"
            >
                {isSearching ? (
                    <SearchResults />
                ) : (
                    <RecentSearches
                        searches={recentSearches}
                        onClear={() => console.log('Clear recent searches')}
                        onItemPress={(item) => playTrack({ title: item.title, subtitle: item.subtitle })}
                        onRemoveItem={(id) => console.log('Remove item', id)}
                    />
                )}
            </ScrollView>
        </View>
    );
}
