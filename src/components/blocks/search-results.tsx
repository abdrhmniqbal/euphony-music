import * as React from "react"
import { useState } from "react"
import { Chip } from "heroui-native"
import { Pressable, ScrollView, Text, View } from "react-native"

import { ICON_SIZES } from "@/constants/icon-sizes"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { playTrack, type Track } from "@/modules/player/player.store"
import LocalCheckmarkCircleSolidIcon from "@/components/icons/local/checkmark-circle-solid"
import LocalMoreHorizontalCircleSolidIcon from "@/components/icons/local/more-horizontal-circle-solid"
import LocalMusicNoteSolidIcon from "@/components/icons/local/music-note-solid"
import LocalUserSolidIcon from "@/components/icons/local/user-solid"
import LocalVynilSolidIcon from "@/components/icons/local/vynil-solid"
import { PlaylistArtwork } from "@/components/patterns"
import {
  Item,
  ItemAction,
  ItemContent,
  ItemDescription,
  ItemImage,
  ItemTitle,
} from "@/components/ui"

const SEARCH_TABS = ["All", "Track", "Album", "Artist", "Playlist"] as const
type SearchTab = (typeof SEARCH_TABS)[number]

interface ArtistResult {
  id: string
  name: string
  type: string
  followerCount: number
  isVerified: boolean
  image?: string
}

interface AlbumResult {
  id: string
  title: string
  artist: string
  isVerified: boolean
  image?: string
}

interface PlaylistResult {
  id: string
  title: string
  trackCount: number
  image?: string
  images?: string[]
}

interface SearchResultsProps {
  tracks: Track[]
  playlists?: PlaylistResult[]
  query: string
  onArtistPress?: (artist: ArtistResult) => void
  onAlbumPress?: (album: AlbumResult) => void
  onPlaylistPress?: (playlist: PlaylistResult) => void
  onSeeMoreTracks?: () => void
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  tracks,
  playlists = [],
  query,
  onArtistPress,
  onAlbumPress,
  onPlaylistPress,
  onSeeMoreTracks,
}) => {
  const theme = useThemeColors()
  const [activeTab, setActiveTab] = useState<SearchTab>("All")

  const filteredTracks = (() => {
    if (!query.trim()) return tracks.slice(0, 5)
    const lowerQuery = query.toLowerCase()
    return tracks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.artist?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
  })()

  const artists: ArtistResult[] = (() => {
    const artistMap = new Map<string, ArtistResult>()
    tracks.forEach((track) => {
      const artistName = track.artist || "Unknown Artist"
      if (
        !artistMap.has(artistName) &&
        (!query.trim() ||
          artistName.toLowerCase().includes(query.toLowerCase()))
      ) {
        artistMap.set(artistName, {
          id: artistName,
          name: artistName,
          type: "Artist",
          followerCount: 0,
          isVerified: false,
          image: track.image,
        })
      }
    })
    return Array.from(artistMap.values()).slice(0, 1)
  })()

  const albums: AlbumResult[] = (() => {
    const albumMap = new Map<string, AlbumResult>()
    tracks.forEach((track) => {
      const albumName = track.album || "Unknown Album"
      const normalizedAlbumName = albumName.trim() || "Unknown Album"
      const normalizedArtistName =
        (track.artist || "Unknown Artist").trim() || "Unknown Artist"
      if (
        !albumMap.has(normalizedAlbumName) &&
        (!query.trim() ||
          normalizedAlbumName.toLowerCase().includes(query.toLowerCase()))
      ) {
        albumMap.set(normalizedAlbumName, {
          id: normalizedAlbumName,
          title: normalizedAlbumName,
          artist: normalizedArtistName,
          isVerified: false,
          image: track.image,
        })
      }
    })
    return Array.from(albumMap.values()).slice(0, 4)
  })()

  const filteredPlaylists: PlaylistResult[] = (() => {
    if (!query.trim()) {
      return playlists.slice(0, 5)
    }

    const lowerQuery = query.toLowerCase()
    return playlists
      .filter((playlist) => playlist.title.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
  })()

  const handleTrackPress = (track: Track) => {
    playTrack(track)
  }

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
    return count.toString()
  }

  const showArtists = activeTab === "All" || activeTab === "Artist"
  const showAlbums = activeTab === "All" || activeTab === "Album"
  const showPlaylists = activeTab === "All" || activeTab === "Playlist"
  const showTracks = activeTab === "All" || activeTab === "Track"

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        className="py-4"
      >
        {SEARCH_TABS.map((tab) => (
          <Chip
            key={tab}
            onPress={() => setActiveTab(tab)}
            variant={activeTab === tab ? "primary" : "soft"}
            color={activeTab === tab ? "accent" : "default"}
            size="lg"
          >
            <Chip.Label className="font-medium">{tab}</Chip.Label>
          </Chip>
        ))}
      </ScrollView>

      <View className="gap-8 px-4">
        {showArtists && artists.length > 0 && (
          <View>
            {artists.map((artist) => (
              <Item
                key={artist.id}
                variant="list"
                className="py-1"
                onPress={() => onArtistPress?.(artist)}
              >
                <ItemImage
                  icon={
                    <LocalUserSolidIcon
                      fill="none"
                      width={ICON_SIZES.listFallback}
                      height={ICON_SIZES.listFallback}
                      color={theme.muted}
                    />
                  }
                  image={artist.image}
                  className="h-14 w-14 rounded-full bg-default"
                />
                <ItemContent>
                  <ItemTitle className="text-lg">{artist.name}</ItemTitle>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-xs text-muted">{artist.type}</Text>
                    {artist.followerCount > 0 && (
                      <Text className="text-xs text-muted">
                        ♥{formatFollowerCount(artist.followerCount)}
                      </Text>
                    )}
                  </View>
                </ItemContent>
              </Item>
            ))}
          </View>
        )}

        {showAlbums && albums.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-4 px-4"
          >
            <View className="flex-row gap-4">
              {albums.map((album) => (
                <Item
                  key={album.id}
                  variant="grid"
                  className="w-32"
                  onPress={() => onAlbumPress?.(album)}
                >
                  <ItemImage
                    icon={
                      <LocalVynilSolidIcon
                        fill="none"
                        width={ICON_SIZES.gridFallback}
                        height={ICON_SIZES.gridFallback}
                        color={theme.muted}
                      />
                    }
                    image={album.image}
                    className="rounded-md"
                  />
                  <ItemContent className="mt-1 w-full flex-none justify-start">
                    <ItemTitle
                      className="text-sm text-foreground normal-case"
                      numberOfLines={2}
                    >
                      {album.title || "Unknown Album"}
                    </ItemTitle>
                    <View className="flex-row items-center gap-1">
                      <Text
                        className="flex-1 text-xs text-muted"
                        numberOfLines={1}
                      >
                        {album.artist || "Unknown Artist"}
                      </Text>
                      {album.isVerified && (
                        <LocalCheckmarkCircleSolidIcon
                          fill="none"
                          width={12}
                          height={12}
                          color={theme.accent}
                        />
                      )}
                    </View>
                  </ItemContent>
                </Item>
              ))}
            </View>
          </ScrollView>
        )}

        {showPlaylists && filteredPlaylists.length > 0 && (
          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">
                Playlists
              </Text>
            </View>
            <View className="gap-2">
              {filteredPlaylists.map((playlist) => (
                <Item
                  key={playlist.id}
                  onPress={() => onPlaylistPress?.(playlist)}
                >
                  <ItemImage className="items-center justify-center overflow-hidden bg-default">
                    <PlaylistArtwork
                      images={
                        playlist.images && playlist.images.length > 0
                          ? playlist.images
                          : playlist.image
                            ? [playlist.image]
                            : undefined
                      }
                    />
                  </ItemImage>
                  <ItemContent>
                    <ItemTitle>{playlist.title}</ItemTitle>
                    <ItemDescription>
                      {playlist.trackCount}{" "}
                      {playlist.trackCount === 1 ? "track" : "tracks"}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </View>
          </View>
        )}

        {showTracks && filteredTracks.length > 0 && (
          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">Tracks</Text>
              {onSeeMoreTracks && (
                <Pressable onPress={onSeeMoreTracks}>
                  <Text className="text-xs text-muted">See more</Text>
                </Pressable>
              )}
            </View>
            <View className="gap-2">
              {filteredTracks.map((track) => (
                <Item key={track.id} onPress={() => handleTrackPress(track)}>
                  <ItemImage
                    icon={
                      <LocalMusicNoteSolidIcon
                        fill="none"
                        width={ICON_SIZES.listFallback}
                        height={ICON_SIZES.listFallback}
                        color={theme.muted}
                      />
                    }
                    image={track.image}
                    className="rounded-md"
                  />
                  <ItemContent>
                    <ItemTitle>{track.title}</ItemTitle>
                    <ItemDescription>
                      {track.artist || "Unknown Artist"}
                    </ItemDescription>
                  </ItemContent>
                  <ItemAction>
                    <LocalMoreHorizontalCircleSolidIcon
                      fill="none"
                      width={20}
                      height={20}
                      color={theme.muted}
                    />
                  </ItemAction>
                </Item>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
