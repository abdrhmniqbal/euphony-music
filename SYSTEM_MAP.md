# SYSTEM_MAP.md - Startune Music

## Project Summary

**Purpose:**
Startune Music is an offline-first local music player for Android/iOS built with Expo + React Native. It indexes audio stored locally on the device, enables fast library browsing, and supports rich playback flows without depending on remote accounts or streaming backends.

**Tech Stack (Core):**
- **Runtime:** Expo SDK 56, React Native 0.85, React 19.2
- **Language:** TypeScript 5+
- **Package Manager:** Bun
- **Database:** SQLite (expo-sqlite, driver: expo) at `emp_music_v2.db`
- **ORM:** Drizzle ORM 0.45+
- **Data Fetching:** React Query (TanStack) 5.90+
- **State Management:** Zustand (UI store, player store, indexer store, settings store)
- **Styling:** Tailwind CSS v4 via Uniwind + HeroUI Native
- **Audio Playback:** Expo Audio (`expo-audio`) through a singleton local queue adapter
- **Routing:** Expo Router 6.0+ (File-based routing)
- **Media Access:** Expo Media Library
- **Native APIs:** Expo File System, Expo Notifications, Expo Linking, Android audio open intents, Google Cast (react-native-google-cast)
- **UI Components:** HeroUI Native, React Navigation, Reanimated 3
- **Build:** Metro + Babel, EAS Build (via eas.json)

**Architecture Pattern:**
- **Modular Functional:** Features isolated in `/src/modules/*` with clear separation: UI → Service → Repository → DB
- **Offline-First:** All data stored locally; no network dependencies
- **Reactive:** Zustand stores + React Query for cache invalidation
- **Event-Driven:** Playback events trigger history updates, progress notifications
- **Async Workflows:** Indexing runs as background queued tasks with pause/resume/cancel controls

---

## Core Logic Flow (Function-Level Flowchart)

### 1. **App Launch Flow**
```
App Start
  → Root layout injects notification route handler and starts notification runtime once
  → RootProviders initialized (LocalizationProvider, QueryClientProvider, DatabaseProvider)
  → LocalizationProvider starts localization runtime → ensureLanguageConfigLoaded() reads selected language and initializes i18next
  → DatabaseProvider syncs database runtime from migration status
      → useMigrations() applies migrations from /src/db/migrations
      → loadInitialDatabaseState() → loadTracks() from DB
  → RootProviders starts bootstrap listeners runtime once
  → Display Root Layout (/src/app/_layout.tsx)
  → Screen navigation uses useGuardedRouter() to ignore duplicate same-target push/replace taps during transitions
```

### 2. **Playback Flow (User taps Track)**
```
UI: TrackRow.onPress(track)
  → playTrack(tracks[], selectedTrackId) called (Player Service)
  → Preview sections with "view more" behavior pass the full screen/context track list to playTrack even when only a limited subset is rendered
  → buildPlaybackQueue(tracks, selectedTrackId) → rotate queue so selected is first
  → infer/provide queue source context (album, artist, playlist, genre, search, favorites, folder, track list, external file)
  → setTracksState(), setQueueTrackIdsState(), setQueueContextState() (Zustand)
  → persistPlaybackSession() saves queue ids, cursor, and queue source context for app restart restore
  → setActiveTrack() and hydrate singleton Expo Audio queue adapter
  → Expo Audio player loads the selected track and starts playback from active index
  → PlaybackService (registered on load) handles Expo Audio adapter playback events
    → handleCrossfadeProgress() reads audio crossfade settings and applies volume ramps near track transitions
    → handleTrackActivated() sets pending track for activity guard
    → handleTrackProgress() records activity only after the configured "count as played" percentage of track duration is reached (default 15%):
      → addTrackToHistory(trackId) to play_history table
      → incrementTrackPlayCount(trackId)
       → queryClient.invalidateQueries (refresh history UI)
  → UI: useIsPlaying(), useCurrentTrack(), usePlayerQueueContext() subscribe & render
  → Player controls (seek, repeat, shuffle, next/prev) ↔ player.store + Player Service
  → Player action sheet sleep timer config writes in-memory sleep timer state:
      → Timer minutes and exact clock time stop playback once their target timestamp is reached
      → Play Count decrements as tracks finish and stops playback when the remaining count reaches zero
      → End of current track stops playback at the end of the currently active track
      → Player playback events evaluate and enforce sleep timer conditions during progress and track changes
  → LyricsView resolves sidecar or embedded lyrics via cached lyrics-source
      → lyrics.ts parses static text, LRC/JSON synced lyrics, reusable timed-markup lyrics (TTML or TTML-like embedded payloads), and embedded angle timestamp lyrics such as `<01:00.57>line<01:01.36>`
  → Lyrics controls remember karaoke mode and zoom level in ui.store for current app session only
```

### 2b. **External Audio File Open Flow**
```
Android file manager sends ACTION_VIEW audio URI
  → app.json / AndroidManifest intent filter accepts content:// and file:// audio/*
  → src/app/+native-intent.tsx redirectSystemPath() detects external audio path, including Android content:/, encoded content://, MiXplorer app-scheme wrappers, and document-provider variants
  → Redirects to /player?externalUri=...
  → PlayerRoute schedules player-intent-runtime and reads its pending handoff snapshot
  → player-intent-runtime waits for waitForBootstrapComplete()
  → playExternalFileUri()
      → resolvePlayableFileUri() resolves content:// to file:// when possible, or copies unresolved shared content into cache
      → If the URI/path or Android media/document id matches an indexed library row from player state or SQLite, plays that indexed Track as a one-item queue so favorites, playlists, history, and library actions work normally
      → Otherwise reads direct file metadata/artwork through the native metadata retriever and writes a normal library track row plus artist/album/genre relations
      → Adds the newly indexed track to player state, then plays it as a one-item indexed queue
      → If the indexing write fails, falls back to a transient external Track so playback still starts
```

### 3. **Library Indexing Flow (Auto-scan or Manual Trigger)**
```
startIndexing(forceFullScan, showProgress)
  → Check isIndexerRunActive() → if yes, queue & return
  → scanMediaLibrary(forceFullScan): 
       → RequestPermission (Expo Media Library)
       → getMediaLibraryPermission() checks Android/iOS permissions
       → MediaLibrary.getAssetsAsync() → scan device audio files
       → applyFolderFilters() (whitelist/blacklist)
       → applyTrackDurationFilter() (min/max duration)
  → For each batch (BATCH_SIZE=24, BATCH_CONCURRENCY=4):
       → extractMetadata() via JSMediaTags.js
       → Persist raw_artist/raw_album_artist/raw_genre for future split-setting rebuilds
       → saveArtworkToCache() (hash-based dedup)
       → Preloaded artist/album/genre lookup cache resolves relations
       → In-memory genre visual allocator avoids repeated full genre scans
       → updateOrCreateTrackArtist, Album, Genre records
       → Batch commit emits an incremental refresh signal
       → refreshIndexedMediaState() is throttled during the run so committed tracks appear in library/player state before indexing completes
  → Persist to DB: upsert tracks, artists, albums, genres, track_genres, track_artists
  → updateIndexerProgress() → trigger notification UI
      → Active notifications stay sticky with pause/resume/cancel actions; terminal complete/fail notifications are tap-dismissable and route through root notification response handling
  → refreshIndexedMediaState() → invalidate React Query library caches
  → onIndexingComplete() → show toast, update indexer.store state
```

### 3b. **Split Metadata Settings Rebuild Flow**
```
User changes split multiple values
  → setSplitMultipleValueConfig() persists split-multiple-values.json
  → rebuildSplitRelationsForConfig()
      → Reads tracks.raw_artist/raw_album_artist/raw_genre from SQLite
      → Re-parses artist and genre relation values without reading media files
      → Rewrites track artistId, albumId, track_artists, and track_genres in small transactions
      → Preserves the primary artist in track_artists so artist counts and search visibility stay in sync
      → Recomputes stored artist artwork from primary-track ownership, then featured-track artwork fallback, and updates artist, album, and genre counts
      → refreshIndexedMediaState() reloads player/library query state
  → If older rows are missing raw metadata, rebuild still reports the gap, but the settings UI treats it as informational only and does not block navigation
```

### 3c. **Artist Picker Reuse Flow**
```
Track action sheet / player route
  → buildArtistPickerItems()
    → Reads stored artist-row artwork for the primary and featured artists
      → Attaches track-count subtitles for primary and featured artists
      → Dedupe values case-insensitively
  → ArtistPickerSheet()
      → Displays reusable artist selection sheet with artwork and counts
      → Navigates to artist details on selection

Player route picker hydration
  → getArtistsByNames()
      → Loads stored artist artwork and counts for the current track's artist names
      → Enriches the picker source before the sheet renders

Artist detail screen
  → useArtistByName(name)
    → Reads the canonical artist row artwork stored during reindex
    → Uses the route name instead of the first matched track's primary artist
```

### 4. **Search Flow**
```
UI: SearchInput.onChange(query)
  → searchLibrary(query) called (Library Repository)
  → Query DB: 
    → SELECT * FROM tracks WHERE title LIKE ? OR primary/featured artist LIKE ? …
       → SELECT * FROM albums WHERE title LIKE ? …
       → SELECT * FROM artists WHERE name LIKE ? …
       → SELECT * FROM playlists WHERE name LIKE ? …
  → Return SearchResults { tracks, albums, artists, playlists }
  → React Query caches via useSearch() hook
  → If a track result is selected, SearchInteractionScreen calls playTrack(track, searchResults.tracks) so the queue follows the screen context without writing a recent-search item
  → Add to recentSearches (local JSON config file) if artist/album/playlist or submitted query selected
```

### 5. **Favorites & Playlist Management**
```
User adds Track to Favorites:
  → toggleTrackFavorite(trackId) (Player Favorites Service)
  → UPDATE tracks SET isFavorite=1, favoritedAt=NOW()
  → queryClient.invalidateQueries(libraryKeys.favorites)
  → useTracksFavorites() hook re-fetches & UI updates

Favorites tab playback:
  → FavoritesList filters favorite entries by selected chips (none selected = all)
  → Favorites tab sort sheet supports name, type, and added-to-favorites order
  → FavoritesList resets LegendList scroll/render state on sort change via resetScrollKey
  → LibraryScreen expands visible favorite tracks, albums, artists, and playlists into a Track queue
  → Playlist favorite expansion reads playlist_tracks by playlist id and position
  → Queue is deduped by track id before play/shuffle starts playback
  → Favorite mutations optimistically patch favorite list caches, then invalidate favorite/library queries

Player save queue to playlist:
  → PlayerActionSheet reads current player queue
  → Stores deduped local queue track ids in temporary playlist form draft Zustand state
  → Uses dismissTo("/playlist/form") like other player action sheet navigation
  → PlaylistFormScreen consumes draft initialSelectedTrackIds once
  → User adds title/description and saves through createPlaylist(), or cancels with draft cleared

Genres tab sort:
  → Genres sort sheet supports name and number of tracks
  → LibraryScreen sorts genre cards by trackCount when number-of-tracks sort selected

User creates Playlist:
  → createPlaylist(name, description) (Playlist Mutations)
  → INSERT INTO playlists (id, name, description, ...)
  → UPDATE playlistTracks SET trackIds[] at position order
  → queryClient.invalidateQueries(playlistKeys.all)
```

### 6. **Settings & Auto-Scan Configuration**
```
Settings Saved:
  → ensureAutoScanConfigLoaded() → read from @DocumentsDir/indexer-auto-scan.json
  → ensureAppUpdateConfigLoaded() → read from @DocumentsDir/app-updates.json
  → loadSettingsConfig(AUTO_SCAN_FILE) sanitizes autoScanEnabled, initialScanEnabled, and rescanImmediatelyEnabled
  → If autoScanEnabled + initialScanEnabled: bootstrap schedules startIndexing()
  → If autoScanEnabled + rescanImmediatelyEnabled: media-library changes schedule immediate foreground rescans
  → If autoScanEnabled: app foreground/open events schedule the normal delayed rescan
  → ensureAudioPlaybackConfigLoaded() → read from @DocumentsDir/audio-playback.json
  → ensureFolderFilterConfigLoaded() → read from @DocumentsDir/folder-filters.json
  → ensureTrackDurationFilterConfigLoaded() → read from @DocumentsDir/track-duration-filter.json
  → ensureCrossfadeConfigLoaded() → read from @DocumentsDir/audio-crossfade.json
  → ensureCountAsPlayedConfigLoaded() → read from @DocumentsDir/count-as-played.json
  → Filters applied at next indexing cycle

App Update Check:
  → AppUpdateSheet mounts from the root layout after providers are available
  → ensureAppUpdateConfigLoaded() reads notification and preview-release preferences
      → If the installed version contains a preview suffix such as -rc, prerelease checks default on
  → checkForAppUpdate() fetches GitHub releases and compares current app version against release tags
  → Stable releases are checked by default; prereleases are included only when Advanced → Join preview releases is enabled
  → If a newer release exists, AppUpdateSheet opens a HeroUI Native bottom sheet with version change, release notes, download/install, don't-remind, and later actions
      → Release notes render via react-native-enriched-markdown so GitHub Markdown appears natively
  → notifyAppUpdateAvailable() schedules one app-update notification per version when update notifications are enabled
  → Don't remind persists notificationsEnabled=false, which also disables future startup update prompts
  → About → Check for updates manually runs the same GitHub release check and opens the same prompt
  → About → What's New fetches GitHub release notes and filters them to versions at or below the installed app version
      → Changelog bodies render through the shared ReleaseNotesMarkdown component

Audio Settings Saved:
  → AudioSettingsScreen toggles transition/resume/audio-focus switches
  → setAudioPlaybackConfig() sanitizes and writes audio-playback.json
  → Player controls read config for fade play/pause/seek behavior
  → PlaybackService RemoteDuck reads config for call, ducking, temporary focus loss, permanent focus loss, and focus-gain resume behavior
  → Bootstrap and AppState listeners read config for resume-on-start and resume-on-reopen behavior

Advanced Settings Reset History:
  → UI: AdvancedSettingsScreen opens confirmation dialog
  → useResetListeningHistory() mutation
  → resetListeningHistory() repository transaction:
       → DELETE FROM play_history
       → UPDATE tracks SET play_count=0, last_played_at=NULL
  → Invalidate history, recently played, top tracks, and tracks query caches
```

---

## Clean Tree

```
src/
├── app/                                      # Expo Router pages
│   ├── _layout.tsx                           # Root layout + providers, toast wrapper
│   ├── index.tsx                             # → Redirect to /(main)/(home)
│   ├── (main)/                               # Main tabbed layout
│   │   ├── _layout.tsx                       # BottomTabBar (Home, Library, Search)
│   │   ├── (home)/
│   │   │   ├── index.tsx                     # Home: recently played, top tracks
│   │   │   ├── recently-played.tsx
│   │   │   └── top-tracks.tsx
│   │   ├── (library)/
│   │   │   ├── index.tsx                     # Library: tabbed view (tracks, albums, artists, playlists, favorites, genres, folders)
│   │   │   ├── album/
│   │   │   ├── artist/
│   │   │   ├── genre/
│   │   │   └── playlist/
│   │   ├── (search)/
│   │   │   ├── index.tsx                     # Search screen
│   │   │   ├── recently-added.tsx           # Full recently added screen
│   │   │   └── search.tsx
│   │   └── settings/
│   │       ├── index.tsx
│   │       ├── about.tsx
│   │       ├── advanced.tsx
│   │       ├── appearance.tsx
│   │       ├── folder-filters.tsx
│   │       ├── library.tsx
│   │       ├── log-level.tsx
│   │       ├── notifications.tsx
│   │       ├── track-duration-filter.tsx
│   │       └── library.tsx
│   ├── notification/
│   │   ├── click.tsx                        # Notification deep-link handler
│   │   └── notification.click.tsx
│   └── player.tsx                            # Full-screen player modal
│
├── assets/
│   └── icons/                                # App icon assets
│
├── components/
│   ├── blocks/                               # Feature-level UI blocks
│   │   ├── album-grid.tsx
│   │   ├── albums-tab.tsx
│   │   ├── artists-tab.tsx
│   │   ├── artist-grid.tsx
│   │   ├── app-update-sheet.tsx              # Startup update prompt bottom sheet
│   │   ├── content-section.tsx
│   │   ├── delete-playlist-dialog.tsx
│   │   ├── delete-track-dialog.tsx
│   │   ├── favorites-list.tsx
│   │   ├── folder-list.tsx
│   │   ├── indexing-progress.tsx
│   │   ├── library-tab-state.tsx
│   │   ├── media-carousel.tsx
│   │   ├── mini-player.tsx
│   │   ├── playback-actions-row.tsx
│   │   ├── playlist-actions-sheet.tsx
│   │   ├── playlist-list.tsx
│   │   ├── playlist-picker-sheet.tsx
│   │   ├── ranked-track-carousel.tsx
│   │   ├── recent-searches.tsx
│   │   ├── release-notes-markdown.tsx        # Themed native Markdown renderer for GitHub release notes
│   │   ├── sort-sheet.tsx
│   │   ├── tracks-tab.tsx
│   │   └── …
│   ├── icons/                                # SVG/icon components
│   ├── patterns/                             # Generic UI patterns
│   │   ├── genre-card.tsx
│   │   ├── track-row.tsx
│   │   └── …
│   ├── providers/
│   │   ├── root-providers.tsx                # QueryClientProvider, DatabaseProvider
│   │   ├── database-provider.tsx             # DB migration & initialization
│   │   ├── localization-provider.tsx         # Loads persisted language and provides i18next
│   │   └── …
│   └── ui/                                   # Base UI components
│       ├── empty-state.tsx
│       ├── scale-loader.tsx
│   │   ├── themed-refresh-control.tsx        # Shared themed pull-to-refresh control
│       └── …
│
├── constants/
│   ├── animations.ts                         # Reanimated timing constants
│   ├── icon-sizes.ts
│   └── layout.ts                             # Tab bar height, mini-player height, padding helpers
│
├── core/
│   ├── audio/
│   │   └── audio-player.service.ts           # Expo Audio playback setup & event registration
│   ├── config/
│   │   └── index.ts
│   └── storage/
│       └── media-library.service.ts          # Expo Media Library permission & access
│
├── db/
│   ├── client.ts                             # Drizzle instance: drizzle(expoDb, schema)
│   ├── schema.ts                             # All SQL table definitions & relations
│   ├── index.ts
│   └── migrations/                           # Generated Drizzle migrations
│       └── migrations.ts
│
├── global.css                                # Uniwind/Tailwind v4 global styles
├── uniwind-types.d.ts                        # Type defs for Uniwind
│
├── layouts/
│   └── stack.tsx                             # Navigation stack config for app routes
│
├── lib/
│   ├── query-invalidation.ts                 # Util: queryClient invalidation helpers
│   └── tanstack-query.ts                     # React Query QueryClient instance
│
├── modules/                                  # Feature modules (clear DDD structure)
│   ├── albums/
│   │   ├── album.keys.ts
│   │   ├── album.queries.ts
│   │   ├── album.mutations.ts
│   │   ├── album.repository.ts
│   │   └── album.types.ts
│   │
│   ├── artists/
│   │   ├── artist.keys.ts
│   │   ├── artist.queries.ts
│   │   ├── artist.mutations.ts
│   │   ├── artist.repository.ts
│   │   └── artist.types.ts
│   │
│   ├── bootstrap/
│   │   ├── bootstrap.runtime.ts              # Startup logic: DB ready, indexer trigger
│   │   ├── bootstrap.utils.ts
│   │   ├── bootstrap-listeners.service.ts
│   │   ├── database-startup.service.ts       # Load cached tracks on app init
│   │   └── …
│   │
│   ├── cast/
│   │   └── cast.service.ts                   # Google Cast integration helpers
│   │
│   ├── device/
│   │   └── device.service.ts                 # Device info & capabilities
│   │
│   ├── favorites/
│   │   ├── favorites.keys.ts
│   │   ├── favorites.queries.ts
│   │   └── …
│   │
│   ├── genres/
│   │   ├── genres.constants.ts               # Genre colors, shapes
│   │   ├── genres.types.ts
│   │   ├── genres.queries.ts
│   │   ├── genres.repository.ts
│   │   └── …
│   │
│   ├── history/
│   │   ├── history.keys.ts
│   │   ├── history.queries.ts                # useRecentlyPlayedTracks(), useTopTracksByPeriod()
│   │   ├── history.repository.ts
│   │   ├── history-cache.service.ts
│   │   └── …
│   │
│   ├── indexer/
│   │   ├── indexer.service.ts                # startIndexing() → core orchestrator
│   │   ├── indexer.repository.ts             # scanMediaLibrary(), batch operations
│   │   ├── indexer-batch-utils.ts            # Async chunking, delays, and event-loop yielding
│   │   ├── indexer-file-identity.ts          # Asset fingerprints, IDs, sort names, stable hashes
│   │   ├── indexer-normalization.ts          # Metadata text/title/genre normalization
│   │   ├── indexer-run-snapshot.repository.ts # Last completed indexer run snapshot persistence
│   │   ├── indexer-scan-filter.ts            # Extension/path eligibility checks
│   │   ├── indexer.store.ts                  # Zustand: progress, status, runtime state
│   │   ├── indexer.types.ts
│   │   ├── indexer-runtime.ts                # isIndexerRunActive(), pause/resume/stop
│   │   ├── indexing-progress-toast-runtime.ts # Progress toast visibility and completion timeout
│   │   ├── indexer-progress.service.ts       # Progress notifications UI
│   │   ├── indexer-notification.service.ts   # Native notification handling
│   │   ├── indexer-refresh.service.ts        # QueryClient invalidation after index
│   │   ├── metadata.repository.ts            # extractMetadata(), saveArtworkToCache()
│   │   └── …
│   │
│   ├── library/
│   │   ├── library.queries.ts                # useArtists(), useAlbums(), useTracks(), useSearch()
│   │   ├── library-artwork.repository.ts     # Dominant album artwork selection and hydration
│   │   ├── library.repository.ts             # listArtists(), listAlbums(), searchLibrary()
│   │   ├── library.keys.ts                   # React Query key factory
│   │   ├── library-sort.store.ts             # Sort order persistence
│   │   ├── library-sort.types.ts
│   │   ├── folder-browser.ts                 # Folder browsing helpers
│   │   └── …
│   │
│   ├── logging/
│   │   ├── logging.service.ts                # logInfo(), logWarn(), logError(), crash logs
│   │   ├── logging.store.ts                  # Log level config (debug/info/warn/error)
│   │   └── …
│   │
│   ├── lyrics/
│   │   ├── lyrics-auto-scroll-runtime.ts     # After-render synced lyric auto-scroll scheduler
│   │   ├── lyrics-source.ts                  # Embedded lyrics, sidecar files (.ttml, .lrc, .xml)
│   │   └── lyrics.ts
│   │
│   ├── localization/
│   │   ├── i18n.ts                           # i18next setup, device locale detection, supported languages
│   │   ├── language-settings.ts              # Persisted language selection
│   │   ├── localization.types.ts             # Language and resource types
│   │   └── resources/                        # Translation catalogs with English fallback for missing keys
│   │
│   ├── navigation/
│   │   ├── stack.tsx                         # Root stack navigation config + shared route transition helpers
│   │   ├── route-warning-runtime.ts          # After-render route parameter warning scheduler
│   │   └── …
│   │
│   ├── player/
│   │   ├── player.service.ts                 # setupPlayer(), playTrack(), core player control
│   │   ├── player-intent-runtime.ts          # Player route initial view and external URI handoff runtime
│   │   ├── player.store.ts                   # Zustand: current track, queue, repeat, shuffle, playback state
│   │   ├── player.repository.ts              # Low-level library track reads
│   │   ├── player.types.ts                   # Track, RepeatMode, etc.
│   │   ├── player.utils.ts                   # Singleton Expo Audio playback queue adapter
│   │   ├── player-selectors.ts               # useCurrentTrack(), useIsPlaying(), etc hooks
│   │   ├── player-adapter.ts                 # mapTrackToAudioPlayerInput(), mapRepeatMode()
│   │   ├── player-activity.service.ts        # handleTrackActivated() → history + play count updates
│   │   ├── player-controls.service.ts        # play(), pause(), next(), prev(), seek()
│   │   ├── player-events.service.ts          # PlaybackService (background event handler)
│   │   ├── player-runtime.service.ts         # Queue operations, shuffle toggling
│   │   ├── player-runtime-state.ts           # setActiveTrack(), setPlaybackProgress()
│   │   ├── player-session.service.ts         # persistPlaybackSession() (current track, position)
│   │   ├── player-session-comparison.ts      # Pure queue/session equality and dedupe helpers
│   │   ├── player-session.repository.ts
│   │   ├── player-favorites.service.ts
│   │   ├── player-library.service.ts         # loadTracks() on app init
│   │   ├── player-colors.service.ts          # Extract dominant color from artwork
│   │   ├── player-colors.store.ts
│   │   ├── player-transition.ts              # Animation transitions (zoom between player views)
│   │   ├── queue.service.ts
│   │   └── …
│   │
│   ├── playlist/
│   │   ├── playlist.queries.ts               # usePlaylists(), usePlaylistById()
│   │   ├── playlist.mutations.ts             # createPlaylist(), updatePlaylist(), deletePlaylist()
│   │   ├── playlist.repository.ts            # DB queries for playlists
│   │   ├── playlist.keys.ts                  # React Query key factory
│   │   ├── playlist-form.ts
│   │   ├── playlist-form-editor.hook.ts
│   │   ├── playlist-picker-selection.hook.ts
│   │   ├── playlist-track-selection.hook.ts
│   │   └── …
│   │
│   ├── search/
│   │   ├── search.queries.ts
│   │   ├── search.repository.ts              # Recent searches persistence
│   │   └── …
│   │
│   ├── settings/
│   │   ├── settings.store.ts                 # Zustand: theme, playback behavior, notifications, update preferences
│   │   ├── settings.repository.ts            # Load/save settings from JSON config files
│   │   ├── app-updates.ts                    # App update notification and prerelease config
│   │   ├── auto-scan.ts                      # Auto-scan enable/disable config
│   │   ├── folder-filters.ts                 # Folder whitelist/blacklist
│   │   ├── track-duration-filter.ts          # Min/max track duration filtering
│   │   └── …
│   │
│   ├── updates/
│   │   └── app-update.service.ts             # GitHub release update checks and app-update notifications
│   │
│   ├── tracks/
│   │   ├── track.keys.ts
│   │   ├── track.queries.ts
│   │   ├── track.mutations.ts
│   │   ├── track.repository.ts
│   │   ├── track-cleanup.repository.ts       # removeTracksFromFavoritesAndPlaylists()
│   │   └── …
│   │
│   └── ui/
│       ├── ui.store.ts                       # Zustand: barsVisible, isPlayerExpanded, playerExpandedView
│       ├── theme.ts                          # Theme colors, dark/light mode
│       └── …
│
├── types/
│   ├── database.ts                           # Type exports from Drizzle schema
│   ├── css.d.ts                              # CSS side-effect import declarations
│   ├── jsmediatags.d.ts
│   └── …
│
└── utils/
    ├── array.ts
    ├── colors.ts
    ├── common.ts
    ├── file-path.ts
    ├── format.ts
    ├── merge-text.ts
    └── transformers.ts
```

---

## Module Map (The Chapters)

| Module | Main Exports | Role |
|--------|-------------|------|
| [src/modules/player/player.service.ts](src/modules/player/player.service.ts) | `setupPlayer()`, `playTrack()` | Core playback engine; initializes the Expo Audio adapter, manages queue rotation, delegates to local audio engine |
| [src/modules/player/player-crossfade.service.ts](src/modules/player/player-crossfade.service.ts) | `handleCrossfadeProgress()`, `handleCrossfadeTrackActivated()`, `resetCrossfadeVolume()` | Applies saved audio crossfade settings to Expo Audio volume transitions |
| [src/modules/indexer/indexer.service.ts](src/modules/indexer/indexer.service.ts) | `startIndexing()`, `pauseIndexing()`, `resumeIndexing()`, `cancelIndexing()` | Orchestrates library indexing; queues runs, controls lifecycle (paused vs active) |
| [src/modules/indexer/indexer.repository.ts](src/modules/indexer/indexer.repository.ts) | `scanMediaLibrary()`, batch commit/delete operations | Scans device audio files, applies folder & duration filters, extracts metadata, batches DB inserts |
| [src/modules/library/library.queries.ts](src/modules/library/library.queries.ts) | `useArtists()`, `useAlbums()`, `useTracks()`, `useSearch()` | React Query hooks for library browsing; caches & eager-loads media catalogs |
| [src/modules/library/library.repository.ts](src/modules/library/library.repository.ts) | `listArtists()`, `listAlbums()`, `searchLibrary()`, `getArtistById()` | Raw DB queries for artists, albums, tracks; supports sorting & filtering |
| [src/modules/bootstrap/bootstrap.runtime.ts](src/modules/bootstrap/bootstrap.runtime.ts) | `completeBootstrap()`, `handleBootstrapDatabaseReady()` | Startup gate: waits for DB ready, triggers first indexing if auto-scan enabled |
| [src/modules/player/player-activity.service.ts](src/modules/player/player-activity.service.ts) | `handleTrackActivated()` | Updates history & play count when track changes; invalidates React Query cache |
| [src/modules/playlist/playlist.mutations.ts](src/modules/playlist/playlist.mutations.ts) | `createPlaylist()`, `updatePlaylist()`, `deletePlaylist()` | Manage playlist CRUD; mutations auto-invalidate queries |
| [src/db/schema.ts](src/db/schema.ts) | `artists`, `albums`, `tracks`, `genres`, `playlists`, `playlistTracks`, `playHistory`, `artworkCache`, `indexerState`, `appSettings` | SQLite table definitions & Drizzle relations |
| [src/components/providers/database-provider.tsx](src/components/providers/database-provider.tsx) | `DatabaseProvider` | React context: applies DB migrations, loads initial state, gates app initialization |
| [src/modules/ui/ui.store.ts](src/modules/ui/ui.store.ts) | `useUIStore`, `openPlayer()`, `closePlayer()` | Zustand store for UI state (mini player vs expanded, bars visible) |
| [src/modules/player/player.store.ts](src/modules/player/player.store.ts) | `usePlayerStore` | Zustand store for playback state (current track, queue, repeat mode, is playing) |
| [src/modules/indexer/indexer.store.ts](src/modules/indexer/indexer.store.ts) | `useIndexerStore` | Zustand store for indexing progress & status |
| [src/modules/settings/settings.store.ts](src/modules/settings/settings.store.ts) | Settings state (theme, playback behavior, update preferences) | Persist user preferences (Zustand backed by JSON files in DocumentsDir) |
| [src/modules/settings/audio-playback.ts](src/modules/settings/audio-playback.ts) | `ensureAudioPlaybackConfigLoaded()`, `setAudioPlaybackConfig()` | Loads and persists audio transition, resume, and audio-focus behavior settings |
| [src/modules/settings/app-updates.ts](src/modules/settings/app-updates.ts) | `ensureAppUpdateConfigLoaded()`, `setAppUpdateConfig()` | Loads and persists app update notification and preview-release preferences |
| [src/modules/updates/app-update.service.ts](src/modules/updates/app-update.service.ts) | `checkForAppUpdate()`, `notifyAppUpdateAvailable()` | Checks GitHub releases and schedules app-update notifications |
| [src/modules/localization/i18n.ts](src/modules/localization/i18n.ts) | `i18n`, `getDeviceLanguageCode()`, `isSupportedLanguageCode()` | Initializes i18next with Expo locale detection, supported language resources, and English fallback resources |
| [src/modules/localization/language-settings.ts](src/modules/localization/language-settings.ts) | `ensureLanguageConfigLoaded()`, `setLanguageCode()`, `getLanguageOptions()` | Persists selected language, defaults to supported system language, and applies it to i18next |
| [src/app/_layout.tsx](src/app/_layout.tsx) | Root layout component | Entry point: wraps app with Providers, sets up notifications, handles Bootstrap lifecycle |
| [src/app/(main)/_layout.tsx](src/app/(main)/_layout.tsx) | Main tabs component | Bottom tab navigation (Home, Library, Search) with mini player |
| [src/app/(main)/(home)/index.tsx](src/app/(main)/(home)/index.tsx) | Home screen | Recently played tracks, top tracks by period (week/month/year) |
| [src/app/(main)/(library)/index.tsx](src/app/(main)/(library)/index.tsx) | Library screen | Tabbed interface: Tracks, Albums, Artists, Playlists, Favorites, Genres, Folders |
| [src/app/(main)/(search)/search.tsx](src/app/(main)/(search)/search.tsx) | Search screen | Search tracks/albums/artists/playlists; recent searches |
| [src/app/settings/theme-mode.tsx](src/app/settings/theme-mode.tsx) | ThemeModeSettingsScreen | Theme mode selection route (Light/Dark/System), navigated from Appearance |
| [src/core/audio/audio-player.service.ts](src/core/audio/audio-player.service.ts) | `registerPlaybackService()`, `initializeExpoAudioPlayer()` | Registers Expo Audio adapter playback handlers and initializes the singleton audio player |
| [src/modules/logging/logging.service.ts](src/modules/logging/logging.service.ts) | `logInfo()`, `logWarn()`, `logError()` | Centralized logging with file I/O (crash logs in DocumentsDir) |
| [src/modules/lyrics/lyrics-source.ts](src/modules/lyrics/lyrics-source.ts) | Sidecar lyrics loader | Extracts lyrics from track metadata, sidecar files (.ttml, .lrc, .xml) |

---

## Data & Config

### Database Location
- **SQLite File:** `emp_music_v2.db` (Expo SQLite, private app documents directory)
- **Drizzle Config:** [drizzle.config.ts](drizzle.config.ts) → schema: `src/db/schema.ts`, migrations: `src/db/migrations`
- **Migrations:** Auto-generated Drizzle migration files in [src/db/migrations/](src/db/migrations/)

### Core Schema (Tables & Relations)

**Entities:**
- **artists** (id PK) → name, sortName, artwork, bio, trackCount, albumCount, isFavorite, favoritedAt
- **albums** (id PK) → title, artistId (FK→artists), year, artwork, totalTracks, discCount, trackCount, duration, isFavorite, favoritedAt
- **genres** (id PK) → name (unique), color, shape (for UI), trackCount
- **tracks** (id PK) → title, artistId (FK), albumId (FK), duration, uri, metadata (bitrate, codec, sampleRate), rawArtist/rawAlbumArtist/rawGenre for split relation rebuilds, trackNumber, discNumber, playCount, lastPlayedAt, isFavorite, favoritedAt, rating, lyrics, composer, artwork
- **playlists** (id PK) → name, description, artwork, trackCount, duration, isFavorite, favoritedAt
- **playlistTracks** (playlistId+trackId PK) → position, addedAt (maintains playlist order)
- **playHistory** (id PK) → trackId (FK), playedAt, duration, completed (bool)
- **trackGenres** (trackId+genreId PK) → many-to-many join
- **trackArtists** (trackId+artistId PK) → role (featured, composer, etc.)

**System:**
- **artworkCache** (hash PK) → path, mimeType, width, height, size, source (embedded/extracted)
- **indexerState** (key PK) → runtime state during scanning
- **appSettings** (key PK) → persisted settings (theme, notifications, etc.)

**Key Indices:** name, sortName, isFavorite, playCount, lastPlayedAt, isDeleted on tracks for fast queries

### Settings & Config Files (JSON in DocumentsDir)

- **indexer-auto-scan.json** → `{ autoScanEnabled: boolean, initialScanEnabled: boolean, rescanImmediatelyEnabled: boolean }` with legacy `{ enabled }` fallback
- **audio-playback.json** → fade play/pause/stop, fade-on-seek, resume-on-start/reopen/call/focus-gain, ducking, short/permanent focus, and in-call pause behavior
- **folder-filters.json** → `{ whitelist: [], blacklist: [] }` (folder paths)
- **track-duration-filter.json** → `{ minDuration: number, maxDuration: number }`
- **library-sort.json** → `{ field: string, order: 'asc'|'desc' }`  
- **logging-level.json** → `{ level: 'debug'|'info'|'warn'|'error' }`
- **language.json** → `{ languageCode: 'en' | 'id' | 'hi' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ru' | 'de' | 'fr' | 'ko' | 'it' | 'es' | 'nl' | 'pt-BR' }`

**Crash/Debug Logs:** `crash-logs.txt` in DocumentsDir (max 1MB, auto-rotated)

### Runtime Artifacts

- **Artwork Cache:** Private app cache directory (from `saveArtworkToCache()`)
- **Player Session State:** In-memory Zustand (current track, queue, playback position)
- **Recent Searches:** In-memory, persisted via `addRecentSearch()` to search repository

---

## External Integrations

| Service | Module | Purpose | Notes |
|---------|--------|---------|-------|
| **Google Cast** | [src/modules/cast/cast.service.ts](src/modules/cast/cast.service.ts) | Remote playback to Chromecast/Cast devices | `react-native-google-cast` wrapper; `isCastConnected()`, `toggleCastPlayback()`, `seekCastPlayback()` |
| **Expo Media Library** | [src/core/storage/media-library.service.ts](src/core/storage/media-library.service.ts) | Scan device audio files, request permissions | Used in indexer: `MediaLibrary.getAssetsAsync()` to enumerate local media |
| **Expo File System** | Various modules | Read/write files (logs, config JSONs, artwork cache) | DocumentsDir for persistent configs, cache for artwork |
| **Expo Audio** | [src/modules/player/player.utils.ts](src/modules/player/player.utils.ts) | Native audio playback engine (Android/iOS) | Owns a singleton `createAudioPlayer()` instance, manages queue, seek, repeat, lock-screen metadata, and volume through `expo-audio`; configured by the `expo-audio` app plugin in [app.json](app.json) |
| **Expo Notifications** | Bootstrap, Indexer | Show indexing progress, notifications | Handled via `expo-notifications`; custom actions (pause, resume, cancel) |
| **Expo Linking** | Navigation | Deep-link handling (notification clicks, external URLs) | Notification click handler at [src/app/notification/click.tsx](src/app/notification/click.tsx) |
| **Android Audio Open Intents** | [app.json](app.json), [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml), [src/app/+native-intent.tsx](src/app/+native-intent.tsx), [src/app/player.tsx](src/app/player.tsx), [src/modules/player/player-intent-runtime.ts](src/modules/player/player-intent-runtime.ts), [src/modules/player/player.service.ts](src/modules/player/player.service.ts) | Register Startune Music in Android file-manager "Open with" sheets and play the selected audio file | `ACTION_VIEW` filters accept `audio/*` over `content://` and `file://` URIs; `redirectSystemPath()` preserves the URI as `externalUri`, then the player intent runtime waits for bootstrap and calls `playExternalFileUri()` |
| **GitHub Releases** | [.github/workflows/release-apk.yml](.github/workflows/release-apk.yml), [.github/workflows/release-notes.yml](.github/workflows/release-notes.yml), [android/app/build.gradle](android/app/build.gradle) | Build signed APKs and attach generated release notes to draft releases | APK workflow creates draft releases from one Gradle ABI-split release build, then release-notes generates categorized notes and patches the matching release ID through the GitHub API |
| **JSMediaTags Library** | [src/modules/indexer/metadata.repository.ts](src/modules/indexer/metadata.repository.ts) | Extract ID3/metadata from audio files | Synchronous metadata reading; also supports sidecar extraction |

**Note:** No remote APIs or cloud backends; purely offline-first.

---

## Architecture Principles & Patterns

### Data Flow

1. **View (React Components)** → Dispatch action or call service
2. **Service Layer** → Business logic, state updates, DB/API calls
3. **Repository Layer** → Raw DB queries via Drizzle ORM
4. **Store (Zustand)** → Subscribes UI, triggers re-renders on state change
5. **React Query** → Caches server state (library queries), invalidates on mutations

### Key Decisions

- **Offline-First:** All data indexed locally; no network dependency
- **Modular:** Each feature (`player`, `indexer`, `library`) is self-contained with service + repository + store
- **Event-Driven:** Playback events trigger history updates; indexing completion invalidates queries
- **Batch Processing:** Indexer processes files in concurrent batches (4 concurrent, size 10) to avoid main-thread blocking
- **Lazy Migrations:** DB schema versioning via Drizzle; migrations run on app launch

### Performance Optimizations

- **React Compiler:** Enabled in `app.json` (react-native v0.81 with experimental flag)
- **Query Caching:** React Query aggressively caches library queries; invalidates only when needed
- **Virtualized Lists:** `@legendapp/list` for efficient rendering of large track/album lists
- **Artwork Deduplication:** Hash-based cache to avoid redundant extractions
- **Pause/Resume Indexing:** Allows responsive UX during background scanning

---

## Risks / Blind Spots

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Database Corruption on Crash** | App fails to start if `emp_music_v2.db` is corrupted | DatabaseProvider has error boundary; logs to crash-logs.txt; user can clear app data |
| **Large Library Performance** | Indexing 10k+ tracks may lag; UI may freeze during batch commits | Concurrent batch processing (4 workers), configurable batch size, pause/resume controls |
| **Artwork Memory Leaks** | Many cached bitmaps in memory during indexing | Artwork cache is disk-based (artworkCache table), but in-memory extraction buffers not explicitly freed |
| **Metadata Extraction Failures** | Bad audio files crash metadata reader (JSMediaTags) | Wrapped in try-catch; individual file errors logged; indexing continues to next file |
| **Missing Permissions** | Indexing fails silently if media library permission denied | Explicit permission check at bootstrap; user guided to settings if needed |
| **Settings File Loss** | Settings files deleted or corrupted → app reverts to defaults | JSON files in DocumentsDir may be lost if device resets; no backup/sync |
| **Notification Actions Delayed** | User taps pause on indexing notification but action takes seconds | Async handler; queueing mechanism prevents race conditions but UX may feel unresponsive |
| **Genre Classification** | Genres extracted from metadata are only as good as audio tags | Fallback to "Unknown" genre if none found; no automatic genre detection |
| **Search Performance** | `LIKE` queries slow for very large track libraries (10k+) | No full-text search indices; could optimize with Drizzle FTS if needed |
| **Track URI Validity** | After rescan, old URIs may be stale if device file structure changed | isDeleted flag prevents orphaned tracks; manual "Force Reindex" triggers cleanup |
| **Cast Integration Testing** | Google Cast code untested on devices without Cast support | Graceful fallback; `isCastConnected()` returns false if cast unavailable |
| **Lyrics Encoding Issues** | Sidecar lyrics with wrong encoding fail to parse | UTF-16BE/ASCII detection in lyrics-source.ts; UTF-8 fallback; invalid bytes skipped |
| **Config File Race Conditions** | Multiple instances write settings JSON simultaneously | Settings ops are serialized (Zustand single store); JSON write is atomic-ish per Expo File System |

### Known Limitations

- **No Cloud Sync:** Local-only; if device resets, all user data (playlists, favorites, play history) is lost
- **No Lyrics Fetch:** Only reads embedded/sidecar lyrics; no online lyric source
- **Single Workspace:** No support for secondary libraries or external USB storage
- **Genre Colors Hardcoded:** Genre UI styling is static; not user-customizable
- **No DSP/Equalizer:** Native player features (EQ, bass boost) not exposed to UI
- **Limited Codec Support:** Depends on device OS support (typically MP3, AAC, FLAC, OGG)

---

## Key Files by Purpose

### Bootstrapping & Lifecycle
- [src/app/_layout.tsx](src/app/_layout.tsx) — Root entry; providers setup
- [src/modules/bootstrap/bootstrap.runtime.ts](src/modules/bootstrap/bootstrap.runtime.ts) — DB ready, indexer startup
- [src/components/providers/database-provider.tsx](src/components/providers/database-provider.tsx) — DB migration & init

### Playback Core
- [src/modules/player/player.service.ts](src/modules/player/player.service.ts) — Play/pause/seek logic
- [src/modules/player/player.store.ts](src/modules/player/player.store.ts) — Playback state (Zustand)
- [src/core/audio/audio-player.service.ts](src/core/audio/audio-player.service.ts) — Expo Audio player setup

### Library & Indexing
- [src/modules/indexer/indexer.service.ts](src/modules/indexer/indexer.service.ts) — Indexing orchestrator
- [src/modules/indexer/indexer.repository.ts](src/modules/indexer/indexer.repository.ts) — File scan & metadata extraction
- [src/modules/library/library.queries.ts](src/modules/library/library.queries.ts) — Data fetching hooks

### Database
- [src/db/schema.ts](src/db/schema.ts) — All table definitions
- [src/db/client.ts](src/db/client.ts) — Drizzle ORM instance
- [src/db/migrations/migrations.ts](src/db/migrations/migrations.ts) — Auto-generated migrations

### UI & Navigation
- [src/app/(main)/_layout.tsx](src/app/(main)/_layout.tsx) — Bottom tab navigation
- [src/modules/ui/ui.store.ts](src/modules/ui/ui.store.ts) — UI state (bars, player expanded view)
- [src/layouts/stack.tsx](src/layouts/stack.tsx) — Navigation screen options

### Settings & Configuration
- [src/modules/settings/settings.store.ts](src/modules/settings/settings.store.ts) — Settings state
- [src/modules/settings/app-updates.ts](src/modules/settings/app-updates.ts) — App update notification and preview-release config
- [src/modules/settings/auto-scan.ts](src/modules/settings/auto-scan.ts) — Auto-scan config loader
- [src/modules/settings/folder-filters.ts](src/modules/settings/folder-filters.ts) — Folder whitelist/blacklist

### Utilities
- [src/modules/logging/logging.service.ts](src/modules/logging/logging.service.ts) — Centralized logging
- [src/lib/tanstack-query.ts](src/lib/tanstack-query.ts) — React Query client
- [src/utils/](src/utils/) — Array, color, path, format utilities
