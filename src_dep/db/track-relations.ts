export const trackHydrationRelations = {
  artist: true,
  featuredArtists: {
    with: {
      artist: true,
    },
  },
  album: true,
  genres: {
    with: {
      genre: true,
    },
  },
} as const

export const trackHydrationRelationsWithAlbumArtist = {
  artist: true,
  featuredArtists: {
    with: {
      artist: true,
    },
  },
  album: {
    with: {
      artist: true,
    },
  },
  genres: {
    with: {
      genre: true,
    },
  },
} as const

export const trackHydrationRelationsWithoutAlbum = {
  artist: true,
  featuredArtists: {
    with: {
      artist: true,
    },
  },
  genres: {
    with: {
      genre: true,
    },
  },
} as const
