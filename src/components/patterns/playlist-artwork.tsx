import { Ionicons } from "@expo/vector-icons";
import { Image, View, type ReactNode } from "react-native";
import { cn } from "tailwind-variants";
import { useThemeColors } from "@/hooks/use-theme-colors";
import LocalPlaylistSolidIcon from "../icons/local/playlist-solid";

interface PlaylistArtworkProps {
  images?: string[];
  className?: string;
  fallback?: ReactNode;
}

function normalizeImages(images?: string[]): string[] {
  if (!images?.length) {
    return [];
  }

  const uniqueImages: string[] = [];

  for (const image of images) {
    if (!image || uniqueImages.includes(image)) {
      continue;
    }

    uniqueImages.push(image);

    if (uniqueImages.length >= 4) {
      break;
    }
  }

  return uniqueImages;
}

function buildGridImages(images: string[]): string[] {
  if (images.length === 0) {
    return [];
  }

  if (images.length >= 4) {
    return images.slice(0, 4);
  }

  const gridImages: string[] = [];

  for (let i = 0; i < 4; i += 1) {
    gridImages.push(images[i % images.length]);
  }

  return gridImages;
}

export function PlaylistArtwork({
  images,
  className,
  fallback,
}: PlaylistArtworkProps) {
  const theme = useThemeColors();
  const gridImages = buildGridImages(normalizeImages(images));

  if (gridImages.length === 0) {
    return (
      <View
        className={cn(
          "h-full w-full items-center justify-center bg-surface",
          className,
        )}
      >
        {fallback || (
          <LocalPlaylistSolidIcon
            fill="none"
            width={24}
            height={24}
            color={theme.muted}
          />
        )}
      </View>
    );
  }

  return (
    <View
      className={cn(
        "h-full w-full flex-row flex-wrap overflow-hidden",
        className,
      )}
    >
      {gridImages.map((image, index) => (
        <Image
          key={`${image}-${index}`}
          source={{ uri: image }}
          className="h-1/2 w-1/2"
          resizeMode="cover"
        />
      ))}
    </View>
  );
}
