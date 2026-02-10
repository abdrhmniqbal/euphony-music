import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PlayerHeaderProps {
    onClose: () => void;
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({ onClose }) => (
    <View className="flex-row items-center justify-between mt-2 h-10 relative">
        <Pressable className="p-2 active:opacity-50 z-10 w-12">
            <Ionicons name="options-outline" size={24} color="white" />
        </Pressable>

        <Pressable
            onPress={onClose}
            className="absolute left-0 right-0 items-center justify-center -top-4 bottom-0 z-0 p-4"
        >
            <View className="w-12 h-1.5 bg-white/40 rounded-full" />
        </Pressable>

        <View className="flex-row gap-4 z-10">
            <Pressable className="p-2 active:opacity-50">
                <Ionicons name="radio-outline" size={24} color="white" />
            </Pressable>
            <Pressable className="p-2 active:opacity-50">
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
            </Pressable>
        </View>
    </View>
);
