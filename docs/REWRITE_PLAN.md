# Rewrite Plan

Goal: rebuild `src/` from scratch into a stable app with identical functionality and interface to the legacy code (archived in `src_dep/`). Reuse installed packages. Reuse data assets (icons, images, licenses JSON, i18n resources, DB migrations) as-is.

## Hard constraints

- **DB compatibility**: drizzle schema and migrations must stay byte-compatible so existing installs upgrade in place.
- **Native layer untouched**: `android/`, `plugins/`, native module registration, `app.config.ts` behavior preserved.
- **Every phase ends bootable**: app launches, `pnpm run check` (lint + typecheck + test) green before every commit, conventional commit per scope.
- **No local builds**: never run expo bundling or gradle builds on this machine; builds and device verification happen in GitHub Actions workflows.
- **No workaround code**: every non-obvious decision gets a short "why" comment or a doc note; no speculative flexibility.

## Architecture rules

```
src/
  app/               expo-router routes only; thin wrappers over blocks
  components/
    ui/              primitives: no business logic, no queries, styling via className
    patterns/        composition patterns; imports ui/ only
    blocks/          feature sections; may use queries/stores/navigation
  domains/           pure domain logic + repositories + react-query hooks per aggregate
  playback/          playback engine: service, queue, actions, notification, intents
  core/              cross-cutting: db client, theme, localization, logging, config
  lib/               generic utils
  constants/         static constants
```

Dependency direction is one-way:

```
core/lib/constants → domains → playback → components/ui → components/patterns → components/blocks → app routes
```

- `ui/` never imports from `patterns/`, `blocks/`, `domains/`, or `app/`.
- `blocks/` never import each other; shared pieces get promoted to `patterns/`.
- Repositories are the only code touching drizzle; queries/mutations wrap repositories via react-query.
- Zustand stores only for ephemeral UI/playback state; persisted preferences go through the settings repository.

## Feature inventory (parity target)

From legacy README + routes/modules:

1. Playback: queue, repeat, shuffle, crossfade, seeking, sleep timer, background audio, media notifications, deep-link/intent handling
2. Library browsing: tracks, albums, artists (multi-artist split modes), genres, playlists, favorites
3. Smart mixes: Daily Mix, For You Mix from listening history
4. Lyrics: TTML / .lrc / embedded parsing, LRCLib auto-fetch fallback, synced view
5. Last.fm: scrobbling, artist bios, artwork scraping
6. Playlists: create/edit/reorder/custom sort, playlist-aware track actions
7. Player surfaces: mini player, full player, queue view, metadata sheet, equalizer loader
8. Indexing: scan with progress notification, auto-scan, folder filters, track-duration filters
9. 15 themes × light/dark via CSS source of truth (`scripts/generate-static-themes.mjs`)
10. Backup/restore settings + auto-backup
11. Search: index, recent searches, recently added tracks
12. Reorderable library tabs with visibility toggles
13. Home: recently played, top tracks (time-ranged)
14. Onboarding + restore flow
15. In-app updates (APK download + progress notification), whats-new
16. Google Cast, widget, battery-optimization prompt
17. Settings hub + ~20 sub-screens, language/i18n, appearance/theme mode
18. About, open-source licenses, log level

## Phases (dependency order; commit per scope inside a phase)

| #   | Phase           | Scope                                                                                                                                                       | Verify                        |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| P0  | Reset           | archive src→src_dep, tooling ignores, bootable skeleton                                                                                                     | boots, check green            |
| P1  | Foundation      | config/constants, logging, db (schema+migrations verbatim), query provider, theme system (global.css + static-themes gen + provider), i18n resources copied | unit tests for db/theme utils |
| P2  | Preferences     | settings repository + preference/view-preference stores                                                                                                     | store tests                   |
| P3  | Indexing        | permissions flow point, media scan, metadata retrieval, persistence, progress notification, folder/duration filters, auto-scan setting                      | indexer pure-logic tests      |
| P4  | Playback engine | audio service, queue store, actions (play/pause/seek/shuffle/repeat), crossfade math, sleep timer, media-session notification, scrobbler hook point         | queue/crossfade/timer tests   |
| P5  | App shell       | root layout, tabs navigation, bottom bar auto-hide, Library tab with track lists playing through engine                                                     | manual boot                   |
| P6  | Player surfaces | MiniPlayer, full player, queue view, metadata sheet                                                                                                         | manual boot                   |
| P7  | Details         | album/artist/genre screens, action sheets, favorite toggles                                                                                                 | manual boot                   |
| P8  | Collections     | playlists CRUD+reorder+form, favorites list, history/recently-played/top-tracks, mixes                                                                      | mix-algo/repository tests     |
| P9  | Search          | search tab, search index, recent searches, recently added                                                                                                   | parser/index tests            |
| P10 | Lyrics          | parsers (TTML/lrc/embedded), LRCLib fetch, player lyrics view                                                                                               | parser tests                  |
| P11 | Onboarding      | first-run permission flow, restore entry                                                                                                                    | manual boot                   |
| P12 | Settings        | hub + all sub-screens, backup/restore (settings + play history), auto-backup                                                                                | backup round-trip test        |
| P13 | Integrations    | Last.fm scrobble/bio/artwork, Deezer artwork cache, Cast, widget, updates, about/licenses/whats-new, notification click routing polish                      | version-compare tests         |

Phases may be split further while implementing; each commit stays revertable.

## Working agreement

- Port logic feature-by-feature from `src_dep/` but rewrite it against the new architecture; do not copy-paste modules wholesale.
- When legacy behavior looks like a bug, flag it before porting it.
- Old tests in `src_dep/**/__tests__` are reference material; re-add relevant ones per phase under the new paths.

## Decisions log

### P1 — Foundation

- **i18n starts from scratch**: single fresh `en.json`, keys added only as features land. Legacy resources had duplicate/mergeable keys. `crowdin.yml` repointed to the new resources dir; other locales return via crowdin once the key set stabilizes.
- **DB schema recreated as fresh migration 0000** from the legacy entity model with dead columns removed (`albums.total_tracks`, `albums.disc_count`, `artwork_cache.width/height/size`). Entity model otherwise kept 1:1 — it maps cleanly to features.
- **DB file renamed** `emp_music_v2.db` → `startune.db`. Existing installs start a clean DB; the old file is left untouched on device (rollback-safe). A one-time legacy import can be added later if upgrade data preservation becomes a requirement.
- Client pragmas: WAL mode + foreign keys ON.
- Theme CSS tokens copied verbatim to `src/global.css` (interface parity); static theme generator output moved to `src/core/theme/static-themes.ts`.

### P2 — Preferences

- **Unified store**: legacy split preferences across three systems (persisted `preferenceStore`, persisted `viewPreferenceStore`, in-memory `settingsStore` hydrated by a 13-entry registry of per-setting loader files). Replaced with two persisted zustand stores under `src/core/preferences/`: one app-preferences store (all configs merged in) and one view-preferences store. The registry and per-setting loader files are gone; zustand persist + a defaults-hydrating merge handles loading and corruption recovery.
- **Dead preference fields dropped** after confirming zero consumers: `separators`, `rcNotification`, `checkForUpdates`, `listAllow`/`listBlock` (indexer actually uses `folderFilterConfig`), `activeCustomTheme*` (unfinished custom-theme feature).
- **Duplicates merged**: `languageCode` (settings store) + `language` (preference store) → single `language`; `minSeconds` folded into `countAsPlayedConfig.minimumSeconds`; `themeId` moved into the main store.
- **Renames for clarity**: `theme` → `themeMode`, `listAllow`/`listBlock` removed, `LoggingConfig{level}` flattened to `loggingLevel`.
- Existing users' old kv-store keys (`startune::preference-store`, `startune::settings::*`) are not migrated; new key is `startune::preferences`. Prefs reset to defaults on upgrade — acceptable per rewrite direction; add a migration later only if requested.

### P3 — Indexing

- **Config access unified**: legacy's `ensure*ConfigLoaded()` per-setting loaders replaced by direct reads from the single preference store; scan pipeline reads all filters/split config once at run start.
- **Filters are pure predicates** under `scan/folder-filter.ts` / `scan/duration-filter.ts` (unit-testable, no store or i18n coupling). Content-URI → path conversion ported for scoped-storage whitelist/blacklist matching.
- **Metadata module split**: `metadata/extract.ts` (retriever + embedded ID3/MP4 lyrics + sidecar lookup), `metadata/artwork-cache.ts` (cache dir + DB bookkeeping), `metadata/normalize.ts` (pure normalization).
- **Deezer artwork refresh deferred** to P13 (integrations); service no longer triggers it inline.
- **`refreshIndexedMediaState`** now only invalidates react-query keys from a central `domains/library/query-keys.ts`; player cache reload (`loadTracks`) moves into P4 playback wiring.
- Scan progress notification ported with throttled updates (visible 120ms / notification 750ms) and pause/resume/cancel actions.

### P4 — Playback engine

- **Dual-store pattern preserved**: persisted `playback/playback-store.ts` (queue, active track, position, shuffle/repeat) holds source of truth; in-memory `playback/player-store.ts` is the UI read-model. The subscriber that projects persisted state into the read-model lands with P5/P6 (no UI consumers yet).
- **Queue re-resolution stays lazy**: `getTrack` resolves from DB on demand; queue arrays store keys (`trackId` or `trackId__uniqueId` for duplicates), so stale rows self-heal on access.
- **Pure queue math extracted** to `actions/queue-state.ts` (move/remove/insert calculations) with unit tests; remove semantics match legacy — the active track is never dropped from the queue, `activeTrackRemoved` only flags a native-player reload of the same slot.
- **Crossfade ported verbatim** (`crossfade.ts` + `crossfade-math.ts`, legacy tests included); config now read from the unified preference store.
- **Sleep timer ported** with all five modes (minutes/playCount/trackEnd/clock/off); state lives in the player store.
- **`applyReplayGainToTrack` simplified**: `native-track.ts` maps tracks with `replayGain: 0`; real gain analysis deferred to P13.
- **Mixes return empty** until P8; widget revalidation and colors extraction stubbed out until P13/P6; intents (`playExternalFileUri`) deferred to P11.
- **Scrobbler hook point kept**: `service.playTrack` calls `activity.handleTrackActivated` (placeholder); play-count + history writes happen in `listeners.ts` after the count-as-played threshold, invalidating tracks/history query keys.
- **Startup wiring**: `playback/runtime.ts` (setupPlayer → registerPlaybackListeners → restoreActiveTrack → restoreCurrentTrackForStartup) invoked from the root layout after the DB gate; last-position restore honors the `restoreLastPosition` preference.
- **New domains support**: `domains/tracks/repository.ts` (toDataTrack with artist split display, maybeGetTrack, addPlayedTrack) and `domains/library/queue-sources.ts` (album/artist/genre/folder/playlist/favorites id resolution; playlist keyed by ID now instead of name).

### P5 — App shell

- **Tabs shell ported** (`app/(main)/_layout.tsx`): three tabs (home/search/library) with animated bottom-bar hide driven by a session-only `core/ui/store.ts` `barsVisible` flag; `useAutoHideHeaderScroll` hides bars while scrolling and restores them after 200ms idle (or when the list is non-scrollable). MiniPlayer slot intentionally omitted until P6 — the hidden offset accounts for tab bar only for now.
- **Local icons generated**: `scripts/generate-icons.mjs` renders `src/assets/icons/*.svg` into `src/components/icons/local/*.tsx` (SvgXml wrappers, same shape as legacy monicon output); regenerate after adding SVGs.
- **Library hub staged**: LibraryTabBar (heroui-native Tabs, visible tabs from the preferences store), TracksTab fully functional (react-query `useTracks` → pure `sortTracks` using view-preference order/asc → LegendList rows via `patterns/track-row` + `ui/media-item`), Play/Shuffle wired through the playback engine. Albums/Artists/Genres/Playlists/Folders/Favorites render a "coming soon" empty state until P7/P8.
- **Projection subscriber landed early** (`playback/subscriber.ts`): persisted playback store → in-memory player read-model so track rows can highlight the active queue item; queue re-resolution still keyed on queue-array identity. Colors extraction remains stubbed until P6.
- **Playback entry points**: `playback/track-list-actions.ts` (playTrackList / shuffleTrackList / playSingleTrackFromList) maps DataTracks to PlayerTracks via `playback/player-track.ts` and starts context-aware playback; no UI imports of engine internals.
- Home and search tabs are placeholder screens pending P8/P9.

### P6 — Player surfaces

- **MiniPlayer + full player ported** into `components/blocks/player/`: mini player (artwork, marquee meta, play/next/queue controls, progress strip) slides in above the tab bar and pushes `/player` with a screen-transitions boundary id; full player renders ambient gradient from the image-colors palette (`playback/colors.ts`, wired into the projection subscriber), drag-to-dismiss handle, queue-context label, seekable progress bar (animated text inputs for live timestamps), repeat/shuffle/prev/play/next controls, and artwork/lyrics/queue expanded views.
- **Queue view** uses `react-native-reorderable-list` with drag handles, per-row removal, played-track dimming, current-track ScaleLoader overlay, and tap-to-play via `skipToQueueItem`.
- **Sleep timer UI ported fully** (minutes slider, play-count slider, end-of-track switch, custom clock time via DateTimePicker) with the draft-state hook; the player action sheet is reduced to the sleep-timer entry — artist/album/playlist menu items land in P7/P8.
- **Cast deferred**: CastButton removed from the header slot, `useCastAwarePlayback` wrapper dropped (controls call local playback directly), ProgressBar seeks locally only. Reintroduce with P13 integrations.
- **Favorites toggle on TrackInfo deferred** to P7 (needs favorites queries/mutations); lyrics view shows a localized placeholder until P10.
- **Toast runtime landed**: `HeroUINativeProvider` + `AppToastRuntime` in the root layout so `showAppToast` calls (e.g. added-to-queue) render; root stack now registers the `/player` route with boundary-transition options.

### P7 — Detail screens

- **Favorites domain** (`domains/favorites/`): repository (track/artist/album/playlist favorite rows via `isFavorite` + `favoritedAt`), queries (`useFavorites`, `useIsFavorite`), optimistic toggle mutation with rollback + toast feedback; invalidates favorites/library keys on settle.
- **Session sort store** (`domains/library/sort-store.ts`): in-memory per-screen sort configs (AlbumTracks/ArtistTracks/ArtistAlbums) — resets on restart like legacy; pure comparators live in `domains/tracks/detail-sort.ts` (sortPlayerTracks/sortAlbums/sortArtists, playCount ties break on lastPlayedAt).
- **TrackList block** (`components/blocks/track-list.tsx`): LegendList + memoized rows (rank numbers, cover/artist hiding, disc separators via renderItemPrefix, active-track highlight + ScaleLoader) and long-press TrackActionSheet (favorite/play next/add to queue/view metadata). Playlist picker, delete dialog, artist/genre navigation rows deferred to P8/P10.
- **Metadata sheet reduced**: quick facts (duration/year/codec/format/bitrate/plays) from the DB row only; cross-navigation links and open-file land later.
- **Album detail**: header collapse title, favorite + overflow actions, track-number sort sheet, multi-disc separators, CollectionActionSheet (favorite/play-next/add-to-queue for any collection type via `getQueueSourceTrackIds`). Album→detail shared-element transition simplified to fade_from_bottom stack animation (Boundary ids kept in helpers for later).
- **Artist detail**: parallax hero, solid-on-scroll header, overview (top 5 tracks + album carousels + bio)/tracks/albums/featuredOn views sharing one hero, artist matching honors split-multiple-values config, albums derived client-side via dominant-artwork selection (`domains/artists/utils.ts`).
- **Genre detail simplified**: single screen with top 25 tracks (playCount order) + horizontal recommended-albums grid; legacy ContentSection/RankedTrackCarousel chunking and separate top-tracks/albums sub-routes dropped as presentation-only. Genre details query resolves ID3V1 numeric-name aliases via existing constants.
- **Library hub tabs live**: AlbumsTab (2-col grid), ArtistsTab (3-col round grid), LibraryGenresSection (patterned GenreCards); all push detail routes; Playlists/Folders/Favorites stay "coming soon" until P8. Tab-level sort triggers deferred (defaults match legacy). Player menu goToArtist/goToAlbum entries deferred to the search/value-navigation-sheet phase; TrackInfo favorite toggle landed with this phase.

### P8 — Collections

- **Playlists domain** (`domains/playlists/`): repository (CRUD, membership replace on save with chunked inserts for SQLite var limits, resequencing on remove, reorder), queries/mutations (`usePlaylists`, `usePlaylist`, `useSavePlaylist`, `useDeletePlaylist`, `useRemoveTrackFromPlaylist`, `useAddTracksToPlaylist`), form-draft store for "save queue to playlist" hand-off, clamped name (20)/description (40) inputs, track picker sheet (search + recent-first suggestions + selection order preserved).
- **Playlist UI**: library-hub Playlists tab (create row + list rows w/ 2×2 PlaylistArtwork grid), detail screen (custom-order/added-date/default sorts, favorite toggle, edit/delete via CollectionActionSheet + delete dialog), full-screen create/edit form with ReorderableList track ordering.
- **Favorites tab**: unified favorites list in the library hub (type filter chips, type badges, per-row un-favorite heart); rows navigate to artist/album/playlist details; track favorites play through the favorites queue context; long-press opens TrackActionSheet (tracks) or CollectionActionSheet (collections).
- **History** (`domains/history/`): recently-played (deduped) and top-tracks-by-period (day/week/month/all with local boundaries) repositories + queries over `play_history` joined to tracks.
- **Home screen**: ContentSection + MediaCarousel + RankedTrackCarousel blocks ported; recently played horizontal preview and top-tracks paged ranking with pull-to-refresh (indexer refresh); drill-down routes `(home)/recently-played` and `(home)/top-tracks` with period tabs and PlaybackActionsRow.
- **Mixes** (`domains/mixes/`): pure mix-algo port (deterministic shuffle, day/week seeds, profile build/scoring) with tests; repository persists Daily Mix (day expiry) / For You Mix (week expiry) into `mixes`/`mix_tracks` with visual identity from `domains/visuals/shared`; queries `useDailyMix`/`useForYouMix`. UI surfacing lands with the P9 search tab.
- **Add-to-playlist**: shared `PlaylistPickerSheet` block used by both TrackActionSheet (single track, plus remove-from-this-playlist when inside a playlist detail) and the player action sheet (current track); "save queue to playlist" seeds the playlist form draft with the current queue.
- Deferred: track-file delete dialog (lands with settings/files phase), player-menu goToArtist/goToAlbum (P9 value-navigation).

### P9 — Search

- **Search domain** (`domains/search/`): `searchLibrary` repository (LIKE matching across artists/albums/playlists/tracks incl. featured-artist joins, relation-expanded track pool merged into top 20), recent-searches persisted in `app_settings` JSON with hydration + dedupe (max 30), debounced `useSearch` (react-pacer) plus recent-search mutations that write through to the query cache.
- **Search landing tab**: fake input pushes the interactive route; Daily Mix / For You Mix MixCards (patterned footer, rainbow palette, long-press → CollectionActionSheet save-to-playlist via form draft); recently-added horizontal preview + full drill-down route.
- **Mix detail** (`(search)/mix/[id]`): header artwork collage, generated-at/duration meta, play/shuffle actions, TrackList, save-to-playlist.
- **Interactive search**: auto-focused input, recent searches list (type badges, per-row remove, clear all), tabbed results (All/Tracks/Albums/Artists/Playlists) in one LegendList with section headers and empty state; rows navigate to artist/album/playlist details or play tracks through the search queue context; long-press opens TrackActionSheet/CollectionActionSheet; result presses record recent searches.
- **Player menu navigation**: goToArtist (ValueNavigationSheet chooser when raw artist splits to multiple names) and goToAlbum entries wired in both the player action sheet and TrackActionSheet.
