import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useUniwind } from "uniwind";

interface SettingItemProps {
    title: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightIcon?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
    title,
    value,
    onPress,
    showChevron = true,
    rightIcon
}) => {
    const theme = useThemeColors();

    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center px-6 py-4 active:opacity-70 bg-background"
        >
            <Text className="flex-1 text-[17px] text-foreground font-normal">{title}</Text>
            <View className="flex-row items-center gap-2">
                {value && <Text className="text-[15px] text-muted">{value}</Text>}
                {rightIcon}
                {showChevron && <Ionicons name="chevron-forward" size={20} color={theme.muted} style={{ opacity: 0.5 }} />}
            </View>
        </Pressable>
    );
};

interface SectionHeaderProps {
    title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
    <View className="px-6 pt-8 pb-3">
        <Text className="text-[13px] font-medium text-muted uppercase tracking-wider">{title}</Text>
    </View>
);

interface SettingSection {
    title: string;
    items: {
        id: string;
        title: string;
        value?: string;
        route?: string;
        showChevron?: boolean;
    }[];
}

const SETTINGS_SECTIONS: SettingSection[] = [
    {
        title: "Interface",
        items: [
            { id: "appearance", title: "Appearance", route: "/settings/appearance" },
        ],
    },
];

export default function SettingsScreen() {
    const router = useRouter();
    const { theme: currentTheme, hasAdaptiveThemes } = useUniwind();

    const currentAppearance = hasAdaptiveThemes ? 'System' : (currentTheme === 'dark' ? 'Dark' : 'Light');

    function handleItemPress(route?: string) {
        if (route) {
            router.push(route as never);
        }
    }

    function getItemValue(itemId: string): string | undefined {
        switch (itemId) {
            case 'appearance':
                return currentAppearance;
            default:
                return undefined;
        }
    }

    return (
        <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
            {SETTINGS_SECTIONS.map((section) => (
                <View key={section.title}>
                    <SectionHeader title={section.title} />
                    {section.items.map((item) => (
                        <SettingItem
                            key={item.id}
                            title={item.title}
                            value={getItemValue(item.id)}
                            onPress={() => handleItemPress(item.route)}
                            showChevron={item.showChevron !== false}
                        />
                    ))}
                </View>
            ))}
        </ScrollView>
    );
}
