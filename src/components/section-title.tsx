import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface SectionTitleProps {
    title: string;
    subtitle?: string; // New subtitle prop
    className?: string;
    onViewMore?: () => void;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, className = "", onViewMore }) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View className={`${className} mb-4`}>
            <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold text-foreground">
                    {title}
                </Text>
                {onViewMore && (
                    <Pressable onPress={onViewMore} hitSlop={20}>
                        <Ionicons name="chevron-forward" size={20} color={theme.muted} />
                    </Pressable>
                )}
            </View>
            {subtitle && (
                <Text className="text-xs text-muted mt-0.5">
                    {subtitle}
                </Text>
            )}
        </View>
    );
};
