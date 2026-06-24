import type { RecentSearchItem } from "@/components/blocks/recent-searches"
import {
  resolveAlbumTransitionId,
  resolveArtistTransitionId,
  resolvePlaylistTransitionId,
} from "@/modules/artists/artist-transition"
import type {
  SearchAlbumResult,
  SearchArtistResult,
  SearchPlaylistResult,
} from "@/modules/library/types"

export type SearchAction = {
  recentSearch?: RecentSearchItem
  route?: {
    pathname: string
    params: Record<string, string | undefined>
  }
  sheet?: {
    visible: boolean
    type: "artist" | "album" | "playlist"
    id: string
    name: string
    subtitle: string
    image?: string
    images?: string[]
    trackCount?: number
  }
  searchQueryUpdate?: string
}

export function resolveRecentItemPress(item: RecentSearchItem): SearchAction {
  if (item.type === "artist" && item.query?.trim()) {
    return {
      recentSearch: item,
      route: {
        pathname: "artist/[name]",
        params: { name: item.query },
      },
    }
  }

  if (item.type === "album" && item.query?.trim()) {
    return {
      recentSearch: item,
      route: {
        pathname: "album/[name]",
        params: {
          name: item.query,
          transitionId: resolveAlbumTransitionId({
            id: item.targetId,
            title: item.title || item.query,
          }),
        },
      },
    }
  }

  if (item.type === "playlist" && item.targetId) {
    return {
      recentSearch: item,
      route: {
        pathname: "playlist/[id]",
        params: {
          id: item.targetId,
          transitionId: resolvePlaylistTransitionId({
            id: item.targetId,
            title: item.title,
          }),
        },
      },
    }
  }

  return {
    searchQueryUpdate: item.query || item.title,
    recentSearch: {
      query: item.query || item.title,
      title: item.title,
      subtitle: item.subtitle,
      type: item.type,
      targetId: item.targetId,
      image: item.image,
      images: item.images,
    },
  }
}

export function resolveArtistPress(
  artist: SearchArtistResult,
  trackCountLabel: string
): SearchAction {
  return {
    recentSearch: {
      query: artist.name,
      title: artist.name,
      subtitle: trackCountLabel,
      type: "artist",
      targetId: artist.id,
      image: artist.image,
    },
    route: {
      pathname: "artist/[name]",
      params: {
        name: artist.name,
        transitionId: resolveArtistTransitionId({
          id: artist.id,
          name: artist.name,
        }),
      },
    },
  }
}

export function resolveArtistLongPress(
  artist: SearchArtistResult,
  trackCountLabel: string
): SearchAction {
  return {
    sheet: {
      visible: true,
      type: "artist",
      id: artist.id,
      name: artist.name,
      subtitle: trackCountLabel,
      image: artist.image,
      trackCount: artist.trackCount,
    },
  }
}

export function resolveAlbumPress(album: SearchAlbumResult, albumLabel: string): SearchAction {
  return {
    recentSearch: {
      query: album.title,
      title: album.title,
      subtitle: album.artist || albumLabel,
      type: "album",
      targetId: album.id,
      image: album.image,
    },
    route: {
      pathname: "album/[name]",
      params: {
        name: album.title,
        transitionId: resolveAlbumTransitionId({
          id: album.id,
          title: album.title,
        }),
      },
    },
  }
}

export function resolveAlbumLongPress(
  album: SearchAlbumResult,
  fallbackArtistLabel: string
): SearchAction {
  return {
    sheet: {
      visible: true,
      type: "album",
      id: album.id,
      name: album.title,
      subtitle: album.artist || fallbackArtistLabel,
      image: album.image,
    },
  }
}

export function resolvePlaylistPress(
  playlist: SearchPlaylistResult,
  trackCountLabel: string
): SearchAction {
  return {
    recentSearch: {
      query: playlist.title,
      title: playlist.title,
      subtitle: trackCountLabel,
      type: "playlist",
      targetId: playlist.id,
      image: playlist.image || playlist.images?.[0],
      images: playlist.images,
    },
    route: {
      pathname: "playlist/[id]",
      params: {
        id: playlist.id,
        transitionId: resolvePlaylistTransitionId({
          id: playlist.id,
          title: playlist.title,
        }),
      },
    },
  }
}

export function resolvePlaylistLongPress(
  playlist: SearchPlaylistResult,
  trackCountLabel: string
): SearchAction {
  return {
    sheet: {
      visible: true,
      type: "playlist",
      id: playlist.id,
      name: playlist.title,
      subtitle: trackCountLabel,
      image: playlist.image,
      images: playlist.images,
      trackCount: playlist.trackCount,
    },
  }
}
