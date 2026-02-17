import { relations } from "drizzle-orm"
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core"

// ==================== CORE TABLES ====================

export const artists = sqliteTable(
  "artists",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    sortName: text("sort_name"),
    artwork: text("artwork"),
    bio: text("bio"),
    trackCount: integer("track_count").default(0),
    albumCount: integer("album_count").default(0),
    isFavorite: integer("is_favorite").default(0),
    favoritedAt: integer("favorited_at"),
    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    nameIdx: index("artists_name_idx").on(table.name),
    sortNameIdx: index("artists_sort_name_idx").on(table.sortName),
    isFavoriteIdx: index("artists_is_favorite_idx").on(table.isFavorite),
  })
)

export const albums = sqliteTable(
  "albums",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    artistId: text("artist_id").references(() => artists.id, {
      onDelete: "set null",
    }),
    year: integer("year"),
    artwork: text("artwork"),
    totalTracks: integer("total_tracks"),
    discCount: integer("disc_count"),
    trackCount: integer("track_count").default(0),
    duration: real("duration"),
    isFavorite: integer("is_favorite").default(0),
    favoritedAt: integer("favorited_at"),
    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    titleIdx: index("albums_title_idx").on(table.title),
    artistIdx: index("albums_artist_idx").on(table.artistId),
    yearIdx: index("albums_year_idx").on(table.year),
    isFavoriteIdx: index("albums_is_favorite_idx").on(table.isFavorite),
  })
)

export const genres = sqliteTable(
  "genres",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    color: text("color").notNull().default("bg-rainbow-lime"),
    shape: text("shape").notNull().default("circles"),
    trackCount: integer("track_count").default(0),
    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    nameIdx: index("genres_name_idx").on(table.name),
  })
)

export const tracks = sqliteTable(
  "tracks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),

    // Foreign keys
    artistId: text("artist_id").references(() => artists.id, {
      onDelete: "set null",
    }),
    albumId: text("album_id").references(() => albums.id, {
      onDelete: "set null",
    }),

    // Media info
    duration: real("duration").notNull(),
    uri: text("uri").notNull(),
    filename: text("filename"),
    fileHash: text("file_hash"),

    // Track metadata
    trackNumber: integer("track_number"),
    discNumber: integer("disc_number"),
    year: integer("year"),

    // User data
    playCount: integer("play_count").default(0),
    lastPlayedAt: integer("last_played_at"),
    isFavorite: integer("is_favorite").default(0),
    favoritedAt: integer("favorited_at"),
    rating: integer("rating"),

    // File management
    dateAdded: integer("date_added"),
    isDeleted: integer("is_deleted").default(0),
    scanTime: integer("scan_time"),

    // Extended metadata
    lyrics: text("lyrics"),
    composer: text("composer"),
    comment: text("comment"),
    artwork: text("artwork"),

    createdAt: integer("created_at")
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    artistIdx: index("tracks_artist_idx").on(table.artistId),
    albumIdx: index("tracks_album_idx").on(table.albumId),
    titleIdx: index("tracks_title_idx").on(table.title),
    favoriteIdx: index("tracks_favorite_idx").on(table.isFavorite),
    deletedIdx: index("tracks_deleted_idx").on(table.isDeleted),
    playCountIdx: index("tracks_play_count_idx").on(table.playCount),
    lastPlayedIdx: index("tracks_last_played_idx").on(table.lastPlayedAt),
  })
)

// ==================== JUNCTION TABLES ====================

export const trackGenres = sqliteTable(
  "track_genres",
  {
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    genreId: text("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.trackId, table.genreId] }),
    trackIdx: index("track_genres_track_idx").on(table.trackId),
    genreIdx: index("track_genres_genre_idx").on(table.genreId),
  })
)

export const trackArtists = sqliteTable(
  "track_artists",
  {
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    role: text("role").default("featured"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.trackId, table.artistId] }),
    trackIdx: index("track_artists_track_idx").on(table.trackId),
    artistIdx: index("track_artists_artist_idx").on(table.artistId),
  })
)

// ==================== USER DATA TABLES ====================

export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  artwork: text("artwork"),
  trackCount: integer("track_count").default(0),
  duration: real("duration"),
  isFavorite: integer("is_favorite").default(0),
  favoritedAt: integer("favorited_at"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
})

export const playlistTracks = sqliteTable(
  "playlist_tracks",
  {
    id: text("id").primaryKey(),
    playlistId: text("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    addedAt: integer("added_at")
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    playlistIdx: index("playlist_tracks_playlist_idx").on(table.playlistId),
    trackIdx: index("playlist_tracks_track_idx").on(table.trackId),
    positionIdx: index("playlist_tracks_position_idx").on(
      table.playlistId,
      table.position
    ),
  })
)

export const playHistory = sqliteTable(
  "play_history",
  {
    id: text("id").primaryKey(),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    playedAt: integer("played_at")
      .notNull()
      .$defaultFn(() => Date.now()),
    duration: real("duration"),
    completed: integer("completed").default(0),
  },
  (table) => ({
    trackIdx: index("play_history_track_idx").on(table.trackId),
    playedAtIdx: index("play_history_played_at_idx").on(table.playedAt),
  })
)

// ==================== SYSTEM TABLES ====================

export const artworkCache = sqliteTable("artwork_cache", {
  hash: text("hash").primaryKey(),
  path: text("path").notNull(),
  mimeType: text("mime_type").default("image/jpeg"),
  width: integer("width"),
  height: integer("height"),
  size: integer("size"),
  source: text("source").default("embedded"),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
})

export const indexerState = sqliteTable("indexer_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
})

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
})

// ==================== RELATIONS ====================

export const artistsRelations = relations(artists, ({ many }) => ({
  tracks: many(tracks),
  albums: many(albums),
  featuredTracks: many(trackArtists),
}))

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, {
    fields: [albums.artistId],
    references: [artists.id],
  }),
  tracks: many(tracks),
}))

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  artist: one(artists, {
    fields: [tracks.artistId],
    references: [artists.id],
  }),
  album: one(albums, {
    fields: [tracks.albumId],
    references: [albums.id],
  }),
  genres: many(trackGenres),
  featuredArtists: many(trackArtists),
  history: many(playHistory),
  playlists: many(playlistTracks),
}))

export const genresRelations = relations(genres, ({ many }) => ({
  tracks: many(trackGenres),
}))

export const trackGenresRelations = relations(trackGenres, ({ one }) => ({
  track: one(tracks, {
    fields: [trackGenres.trackId],
    references: [tracks.id],
  }),
  genre: one(genres, {
    fields: [trackGenres.genreId],
    references: [genres.id],
  }),
}))

export const trackArtistsRelations = relations(trackArtists, ({ one }) => ({
  track: one(tracks, {
    fields: [trackArtists.trackId],
    references: [tracks.id],
  }),
  artist: one(artists, {
    fields: [trackArtists.artistId],
    references: [artists.id],
  }),
}))

export const playlistsRelations = relations(playlists, ({ many }) => ({
  tracks: many(playlistTracks),
}))

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistTracks.playlistId],
    references: [playlists.id],
  }),
  track: one(tracks, {
    fields: [playlistTracks.trackId],
    references: [tracks.id],
  }),
}))

export const playHistoryRelations = relations(playHistory, ({ one }) => ({
  track: one(tracks, {
    fields: [playHistory.trackId],
    references: [tracks.id],
  }),
}))
