import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useUniwind } from "uniwind";

interface SettingItemProps {
    title: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightIcon?: React.ReactNode;
}

const SettingItem = ({ title, value, onPress, showChevron = true, rightIcon }: SettingItemProps) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center px-6 py-4 active:opacity-70 bg-background"
        >
            <Text className="flex-1 text-[17px] text-foreground font-normal">{title}</Text>
            <View className="flex-row items-center gap-2">
                {value && <Text className="text-[15px] text-muted">{value}</Text>}
                {rightIcon}
                {showChevron && <Ionicons name="chevron-forward" size={20} color={theme.muted} className="opacity-50" />}
            </View>
        </Pressable>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <View className="px-6 pt-8 pb-3">
        <Text className="text-[13px] font-medium text-muted uppercase tracking-wider">{title}</Text>
    </View>
);

export default function SettingsScreen() {
    const router = useRouter();
    const { theme: currentTheme, hasAdaptiveThemes } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    const currentAppearance = hasAdaptiveThemes ? 'System' : (currentTheme === 'dark' ? 'Dark' : 'Light');

    return (
        <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
            <SectionHeader title="Interface" />
            <SettingItem
                title="Appearance"
                value={currentAppearance}
                onPress={() => router.push("/settings/appearance")}
            />
        </ScrollView>
    );
}
