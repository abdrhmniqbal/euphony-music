import * as React from "react"
import { useState } from "react"
import { LegendList, type LegendListRenderItemProps } from "@legendapp/list"
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

type SearchResultsListItem =
  | { id: string; type: "section-spacer" }
  | { id: string; type: "section-header"; title: string; showSeeMore?: boolean }
  | { id: string; type: "artist"; artist: ArtistResult }
  | { id: string; type: "album"; album: AlbumResult }
  | { id: string; type: "playlist"; playlist: PlaylistResult }
  | { id: string; type: "track"; track: Track }

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
    return Array.from(artistMap.values()).slice(0, 5)
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
  const isAllTab = activeTab === "All"

  const listData: SearchResultsListItem[] = []

  const pushSectionSpacer = () => {
    if (listData.length === 0) {
      return
    }

    listData.push({
      id: `section-spacer-${listData.length}`,
      type: "section-spacer",
    })
  }

  if (showArtists && artists.length > 0) {
    pushSectionSpacer()
    if (isAllTab) {
      listData.push({
        id: "artists-header",
        type: "section-header",
        title: "Artists",
      })
    }
    artists.forEach((artist) => {
      listData.push({
        id: `artist-${artist.id}`,
        type: "artist",
        artist,
      })
    })
  }

  if (showAlbums && albums.length > 0) {
    pushSectionSpacer()
    if (isAllTab) {
      listData.push({
        id: "albums-header",
        type: "section-header",
        title: "Albums",
      })
    }
    albums.forEach((album) => {
      listData.push({
        id: `album-${album.id}`,
        type: "album",
        album,
      })
    })
  }

  if (showPlaylists && filteredPlaylists.length > 0) {
    pushSectionSpacer()
    if (isAllTab) {
      listData.push({
        id: "playlists-header",
        type: "section-header",
        title: "Playlists",
      })
    }
    filteredPlaylists.forEach((playlist) => {
      listData.push({
        id: `playlist-${playlist.id}`,
        type: "playlist",
        playlist,
      })
    })
  }

  if (showTracks && filteredTracks.length > 0) {
    pushSectionSpacer()
    if (isAllTab || onSeeMoreTracks) {
      listData.push({
        id: "tracks-header",
        type: "section-header",
        title: "Tracks",
        showSeeMore: Boolean(onSeeMoreTracks),
      })
    }
    filteredTracks.forEach((track) => {
      listData.push({
        id: `track-${track.id}`,
        type: "track",
        track,
      })
    })
  }

  const renderListItem = ({ item }: LegendListRenderItemProps<SearchResultsListItem>) => {
    switch (item.type) {
      case "section-spacer":
        return <View className="h-5" />
      case "section-header":
        return (
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">
              {item.title}
            </Text>
            {item.showSeeMore && onSeeMoreTracks && (
              <Pressable onPress={onSeeMoreTracks}>
                <Text className="text-xs text-muted">See more</Text>
              </Pressable>
            )}
          </View>
        )
      case "artist":
        return (
          <Item
            variant="list"
            className="py-1"
            onPress={() => onArtistPress?.(item.artist)}
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
              image={item.artist.image}
              className="h-14 w-14 rounded-full bg-default"
            />
            <ItemContent>
              <ItemTitle className="text-lg">{item.artist.name}</ItemTitle>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs text-muted">{item.artist.type}</Text>
                {item.artist.followerCount > 0 && (
                  <Text className="text-xs text-muted">
                    ♥{formatFollowerCount(item.artist.followerCount)}
                  </Text>
                )}
              </View>
            </ItemContent>
          </Item>
        )
      case "album":
        return (
          <Item onPress={() => onAlbumPress?.(item.album)}>
            <ItemImage
              icon={
                <LocalVynilSolidIcon
                  fill="none"
                  width={ICON_SIZES.listFallback}
                  height={ICON_SIZES.listFallback}
                  color={theme.muted}
                />
              }
              image={item.album.image}
              className="rounded-md"
            />
            <ItemContent>
              <ItemTitle>{item.album.title || "Unknown Album"}</ItemTitle>
              <ItemDescription>
                {item.album.artist || "Unknown Artist"}
              </ItemDescription>
            </ItemContent>
            {item.album.isVerified && (
              <ItemAction>
                <LocalCheckmarkCircleSolidIcon
                  fill="none"
                  width={20}
                  height={20}
                  color={theme.accent}
                />
              </ItemAction>
            )}
          </Item>
        )
      case "playlist":
        return (
          <Item onPress={() => onPlaylistPress?.(item.playlist)}>
            <ItemImage className="items-center justify-center overflow-hidden bg-default">
              <PlaylistArtwork
                images={
                  item.playlist.images && item.playlist.images.length > 0
                    ? item.playlist.images
                    : item.playlist.image
                      ? [item.playlist.image]
                      : undefined
                }
              />
            </ItemImage>
            <ItemContent>
              <ItemTitle>{item.playlist.title}</ItemTitle>
              <ItemDescription>
                {item.playlist.trackCount}{" "}
                {item.playlist.trackCount === 1 ? "track" : "tracks"}
              </ItemDescription>
            </ItemContent>
          </Item>
        )
      case "track":
        return (
          <Item onPress={() => handleTrackPress(item.track)}>
            <ItemImage
              icon={
                <LocalMusicNoteSolidIcon
                  fill="none"
                  width={ICON_SIZES.listFallback}
                  height={ICON_SIZES.listFallback}
                  color={theme.muted}
                />
              }
              image={item.track.image}
              className="rounded-md"
            />
            <ItemContent>
              <ItemTitle>{item.track.title}</ItemTitle>
              <ItemDescription>
                {item.track.artist || "Unknown Artist"}
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
        )
      default:
        return null
    }
  }

  return (
    <View className="flex-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        className="pb-4 pt-3"
        style={{ flexGrow: 0 }}
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
      <LegendList
        data={listData}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        style={{ flex: 1, minHeight: 1 }}
        contentContainerStyle={{
          paddingTop: 6,
          paddingHorizontal: 16,
          paddingBottom: 104,
        }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        recycleItems={true}
        initialContainerPoolRatio={3}
        estimatedItemSize={72}
        drawDistance={220}
      />
    </View>
  )
}
