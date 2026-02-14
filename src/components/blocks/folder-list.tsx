import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  EmptyState,
  Item,
  ItemAction,
  ItemContent,
  ItemDescription,
  ItemImage,
  ItemTitle,
} from "@/components/ui";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { Track } from "@/modules/player/player.store";
import { formatDuration } from "@/utils/format";
import LocalFolderSolidIcon from "@/components/icons/local/folder-solid";
import LocalChevronLeftIcon from "@/components/icons/local/chevron-left";
import { Button, PressableFeedback } from "heroui-native";
import LocalChevronRightIcon from "@/components/icons/local/chevron-right";
import LocalMusicNoteSolidIcon from "../icons/local/music-note-solid";

export interface Folder {
  id: string;
  name: string;
  fileCount: number;
  path?: string;
}

export interface FolderBreadcrumb {
  name: string;
  path: string;
}

interface FolderListProps {
  data: Folder[];
  tracks?: Track[];
  breadcrumbs?: FolderBreadcrumb[];
  onFolderPress?: (folder: Folder) => void;
  onTrackPress?: (track: Track) => void;
  onBackPress?: () => void;
  onBreadcrumbPress?: (path: string) => void;
}

export const FolderList: React.FC<FolderListProps> = ({
  data,
  tracks = [],
  breadcrumbs = [],
  onFolderPress,
  onTrackPress,
  onBackPress,
  onBreadcrumbPress,
}) => {
  const theme = useThemeColors();

  const handlePress = (folder: Folder) => {
    onFolderPress?.(folder);
  };

  const handleTrackPress = (track: Track) => {
    onTrackPress?.(track);
  };

  const formatItemCount = (count: number) =>
    `${count} ${count === 1 ? "item" : "items"}`;

  const renderFolderItem = (item: Folder) => (
    <Item key={item.id} onPress={() => handlePress(item)}>
      <ItemImage
        icon={
          <LocalFolderSolidIcon
            fill="none"
            width={24}
            height={24}
            color={theme.muted}
          />
        }
      />
      <ItemContent>
        <ItemTitle>{item.name}</ItemTitle>
        <ItemDescription>{formatItemCount(item.fileCount)}</ItemDescription>
      </ItemContent>
      <ItemAction>
        <LocalChevronRightIcon
          fill="none"
          width={24}
          height={24}
          color={theme.muted}
        />
      </ItemAction>
    </Item>
  );

  const renderTrackItem = (track: Track) => (
    <Item key={track.id} onPress={() => handleTrackPress(track)}>
      <ItemImage
        icon={
          <LocalMusicNoteSolidIcon
            fill="none"
            width={24}
            height={24}
            color={theme.muted}
          />
        }
        image={track.image}
      />
      <ItemContent>
        <ItemTitle>
          {track.title || track.filename || "Unknown Track"}
        </ItemTitle>
        <ItemDescription>
          {track.artist || "Unknown Artist"} •{" "}
          {formatDuration(track.duration || 0)}
        </ItemDescription>
      </ItemContent>
    </Item>
  );

  const hasEntries = data.length > 0 || tracks.length > 0;
  const hasNestedPath = breadcrumbs.length > 0;

  if (!hasEntries) {
    return (
      <EmptyState
        icon={
          <LocalFolderSolidIcon
            fill="none"
            width={48}
            height={48}
            color={theme.muted}
          />
        }
        title="No Folders"
        message="Music folders you add will appear here."
      />
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {hasNestedPath ? (
        <View className="mb-2">
          <View className="flex-row items-center gap-2 mb-2">
            <Button
              onPress={onBackPress}
              variant="secondary"
              className="w-8 h-8"
              isIconOnly
            >
              <LocalChevronLeftIcon
                fill="none"
                width={16}
                height={16}
                color={theme.foreground}
              />
            </Button>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center", gap: 8 }}
            >
              <PressableFeedback
                onPress={() => onBreadcrumbPress?.("")}
                className="max-w-24"
              >
                <Text
                  className="text-sm text-muted"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Folders
                </Text>
              </PressableFeedback>
              {breadcrumbs.map((breadcrumb) => (
                <View
                  key={breadcrumb.path}
                  className="flex-row items-center gap-2"
                >
                  <LocalChevronRightIcon
                    fill="none"
                    width={12}
                    height={12}
                    color={theme.foreground}
                  />
                  <PressableFeedback
                    onPress={() => onBreadcrumbPress?.(breadcrumb.path)}
                    className="max-w-28"
                  >
                    <Text
                      className="text-sm text-foreground"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {breadcrumb.name}
                    </Text>
                  </PressableFeedback>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
      {data.map(renderFolderItem)}
      {tracks.map(renderTrackItem)}
    </View>
  );
};
