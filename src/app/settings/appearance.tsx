import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Uniwind, useUniwind } from "uniwind";

export default function AppearanceScreen() {
    const { theme: currentTheme, hasAdaptiveThemes } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    const appearanceOptions = [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "System", value: "system" },
    ];

    const currentMode = hasAdaptiveThemes ? "system" : currentTheme;

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="py-2">
                <View className="px-6 pt-8 pb-3">
                    <Text className="text-[13px] font-medium text-muted uppercase tracking-wider">Theme Mode</Text>
                </View>
                {appearanceOptions.map((option) => (
                    <Pressable
                        key={option.value}
                        onPress={() => Uniwind.setTheme(option.value as any)}
                        className="flex-row items-center px-6 py-4 active:opacity-70 bg-background"
                    >
                        <Text className="flex-1 text-[17px] text-foreground font-normal">{option.label}</Text>
                        {currentMode === option.value && (
                            <Ionicons name="checkmark" size={24} color={theme.accent} />
                        )}
                    </Pressable>
                ))}
            </View>
        </ScrollView>
    );
}
