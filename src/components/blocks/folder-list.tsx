import React from "react";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState, Item, ItemAction, ItemContent, ItemDescription, ItemImage, ItemTitle } from "@/components/ui";
import { useThemeColors } from "@/hooks/use-theme-colors";

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
    const theme = useThemeColors();

    const handlePress = (folder: Folder) => {
        onFolderPress?.(folder);
    };

    const formatFileCount = (count: number) =>
        `${count} ${count === 1 ? 'file' : 'files'}`;

    const renderItem = ({ item }: LegendListRenderItemProps<Folder>) => (
        <Item
            onPress={() => handlePress(item)}
        >
            <ItemImage icon="folder-outline" />
            <ItemContent>
                <ItemTitle>{item.name}</ItemTitle>
                <ItemDescription>{formatFileCount(item.fileCount)}</ItemDescription>
            </ItemContent>
            <ItemAction>
                <Ionicons name="chevron-forward" size={24} color={theme.muted} />
            </ItemAction>
        </Item>
    );

    if (data.length === 0) {
        return <EmptyState icon="folder" title="No Folders" message="Music folders you add will appear here." />;
    }

    return (
        <LegendList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 8 }}
            recycleItems={true}
            waitForInitialLayout={false}
            maintainVisibleContentPosition
            estimatedItemSize={72}
            drawDistance={500}
            initialContainerPoolRatio={1}
            style={{ flex: 1 }}
        />
    );
};
