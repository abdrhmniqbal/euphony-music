import React from 'react';
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "heroui-native";
import { useThemeColors } from "@/hooks/use-theme-colors";

export interface SortOption<T extends string> {
    field: T;
    label: string;
}

interface SortSheetProps<T extends string> {
    visible: boolean;
    onClose: () => void;
    options: SortOption<T>[];
    currentField: T;
    currentOrder: 'asc' | 'desc';
    onSelect: (field: T, order?: 'asc' | 'desc') => void;
    title?: string;
}

export function SortSheet<T extends string>({
    visible,
    onClose,
    options,
    currentField,
    currentOrder,
    onSelect,
    title = "Sort By"
}: SortSheetProps<T>) {
    const theme = useThemeColors();

    const handleSelect = (field: T) => {
        if (currentField === field) {
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            onSelect(field, newOrder);
        } else {
            onSelect(field, 'asc');
        }
    };

    return (
        <BottomSheet isOpen={visible} onOpenChange={(open) => !open && onClose()}>
            <BottomSheet.Portal>
                <BottomSheet.Overlay />
                <BottomSheet.Content className="border-none rounded-t-3xl gap-1">
                    <Text className="text-xl font-bold text-foreground mb-4">{title}</Text>
                    {options.map((option) => (
                        <Pressable
                            key={option.field}
                            className="flex-row items-center justify-between py-4 active:opacity-50"
                            onPress={() => handleSelect(option.field)}
                        >
                            <Text className={`text-xl ${currentField === option.field ? 'text-accent font-bold' : 'text-foreground font-medium'}`}>
                                {option.label}
                            </Text>

                            {currentField === option.field && (
                                <View className="p-2 rounded-full">
                                    <Ionicons
                                        name={currentOrder === 'asc' ? "arrow-up" : "arrow-down"}
                                        size={24}
                                        color={theme.accent}
                                    />
                                </View>
                            )}
                        </Pressable>
                    ))}
                </BottomSheet.Content>
            </BottomSheet.Portal>
        </BottomSheet>
    );
}
