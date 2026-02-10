import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { $showPlayerQueue } from "@/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";
import { useThemeColors } from "@/hooks/use-theme-colors";

export const PlayerFooter: React.FC = () => {
    const showQueue = useStore($showPlayerQueue);
    const theme = useThemeColors();

    return (
        <View className="flex-row justify-between items-center px-4">
            <Pressable className="active:opacity-50">
                <Ionicons name="chatbubble-outline" size={24} color={theme.foreground} style={{ opacity: 0.7 }} />
            </Pressable>
            <Pressable
                className="active:opacity-50"
                onPress={() => $showPlayerQueue.set(!showQueue)}
            >
                <Ionicons
                    name="list"
                    size={24}
                    color={showQueue ? theme.accent : theme.foreground}
                    style={{ opacity: showQueue ? 1 : 0.7 }}
                />
            </Pressable>
        </View>
    );
};
