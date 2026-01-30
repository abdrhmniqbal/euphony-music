import React, { useCallback } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Item, ItemImage, ItemContent, ItemTitle, ItemDescription, ItemAction } from "@/components/item";
import { useUniwind } from "uniwind";
import { Colors } from "@/constants/colors";
import { EmptyState } from "@/components/empty-state";

export interface Folder {
    id: string;
    name: string;
    fileCount: number;
    path?: string;
}

interface FolderListProps {
    data: Folder[];
    onFolderPress?: (folder: Folder) => void;
}

export const FolderList: React.FC<FolderListProps> = ({ data, onFolderPress }) => {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    const handlePress = useCallback((folder: Folder) => {
        onFolderPress?.(folder);
    }, [onFolderPress]);

    const formatFileCount = (count: number) =>
        `${count} ${count === 1 ? 'file' : 'files'}`;

    if (data.length === 0) {
        return <EmptyState icon="folder" title="No Folders" message="Music folders you add will appear here." />;
    }

    return (
        <View className="gap-2">
            {data.map((folder) => (
                <Item
                    key={folder.id}
                    onPress={() => handlePress(folder)}
                >
                    <ItemImage icon="folder-outline" />
                    <ItemContent>
                        <ItemTitle>{folder.name}</ItemTitle>
                        <ItemDescription>{formatFileCount(folder.fileCount)}</ItemDescription>
                    </ItemContent>
                    <ItemAction>
                        <Ionicons name="chevron-forward" size={24} color={theme.muted} />
                    </ItemAction>
                </Item>
            ))}
        </View>
    );
};
