import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { $showPlayerQueue } from "@/shared/hooks/scroll-bars.store";
import { useStore } from "@nanostores/react";

export const PlayerFooter: React.FC = () => {
    const showQueue = useStore($showPlayerQueue);

    return (
        <View className="flex-row justify-between items-center px-4">
            <Pressable className="active:opacity-50">
                <Ionicons name="chatbubble-outline" size={24} color="white" style={{ opacity: 0.7 }} />
            </Pressable>
            <Pressable
                className="active:opacity-50"
                onPress={() => $showPlayerQueue.set(!showQueue)}
            >
                <Ionicons
                    name="list"
                    size={24}
                    color={showQueue ? Colors.dark.accent : "white"}
                    style={{ opacity: showQueue ? 1 : 0.7 }}
                />
            </Pressable>
        </View>
    );
};
