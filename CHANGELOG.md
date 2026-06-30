# Changelog

All notable changes to this project are documented in this file.

## [v1.0.0] - 2026-06-30

### ✨ Added

- 15 new themes: Default, Nord, Dracula, Catppuccin, Tokyo, Gruvbox, Everforest, Rose Pine,
  Solarized, Ayu, Monochrome, Aquamarine, Crimson Pulse, Banana Breeze, Candy Pop. (@abdrhmniqbal)
- Theme search filter on settings screen. (@abdrhmniqbal)
- Opus file artwork extraction support. (@abdrhmniqbal)
- Mic-01 and Playlist-03 icons. (@abdrhmniqbal)

### ⚙️ Changed

- Top-tracks time picker changed from BottomSheet to inline Tabs. (@abdrhmniqbal)
- Top-tracks chart now uses unified data source across all time ranges. (@abdrhmniqbal)
- Pull-to-refresh removed from top-tracks (uses scroll-driven refresh only). (@abdrhmniqbal)
- Native header text size increased app-wide. (@abdrhmniqbal)
- Tabs styling updated to match app color conventions. (@abdrhmniqbal)
- Lyrics zoom level now persists between sessions. (@abdrhmniqbal)
- Library tabs now require explicit long-press drag to reorder, preventing accidental reordering. (@abdrhmniqbal)

### 🧩 Fixed

- Playlist form scrolling blocked when touch starts on track list area. (@abdrhmniqbal)
- Mix artwork missing on action sheet. (@abdrhmniqbal)
- Mix visuals no longer overlap with reserved genre colors. (@abdrhmniqbal)
- Sleep timer not applying selected duration correctly. (@abdrhmniqbal)
- Settings search missing some entries. (@abdrhmniqbal)

## [v1.0.0-rc.2] - 2026-06-29

### ✨ Added

- Custom sort order option on playlist detail screen. (@abdrhmniqbal)
- Update timestamp display on mix detail page. (@abdrhmniqbal)

### ⚙️ Changed

- Large-scale codebase refactoring: modularized playback state into dedicated hooks (`useSleepTimerDraft`, `useCastAwarePlayback`, `useQueueTracks`), replaced form state with `@tanstack/react-form`, centralized sheet components under `/sheets`, and collapsed duplicated list elements into `GridList` and `LibraryTab` components. (@abdrhmniqbal)
- Consolidated playlist creation, editing, and player queue save flows. (@abdrhmniqbal)
- Unified action sheet state under `useActionSheet` and `useTrackActions` hooks. (@abdrhmniqbal)
- Restructured settings pages using modular `SettingsListGroup` layout blocks with unified switch/navigation rows. (@abdrhmniqbal)
- Collapsed duplicated search detail layouts into a shared detail stack; extracted `MixCard` for consistent pattern rendering. (@abdrhmniqbal)
- Centralized safe route name decoding via `getSafeRouteName`. (@abdrhmniqbal)

### 🧩 Fixed

- Mixes cache expiry now respects daily/weekly DB regeneration by resetting `staleTime`. (@abdrhmniqbal)
- Conditional sheet mounting in library genres and album detail views no longer causes crashes or interaction failures. (@abdrhmniqbal)
- Full-player dismissability when launching from external file deep-links. (@abdrhmniqbal)
- Action sheet clipping due to conflicting snap points. (@abdrhmniqbal)
- Multi-artist split name display formatting. (@abdrhmniqbal)

## [v1.0.0-rc.1] - 2026-06-25

### ✨ Added

- Adaptive theme system with Nord, Catppuccin (Latte/Mocha), Dracula, and Alucard variants. (@abdrhmniqbal)
- Last.fm integration with artist bio, artwork, scrobbling, and authentication via Elysia proxy service. (@abdrhmniqbal)
- Daily Mix and For You Mix with custom layouts and persisted SQLite state. (@abdrhmniqbal)
- Collection action sheet and artwork grid for mixes. (@abdrhmniqbal)
- Backup and restore settings with automatic backup option. (@abdrhmniqbal)
- Onboarding flow covering theme, folder filters, permissions, and battery settings. (@abdrhmniqbal)
- Search indexing with auto-scroll and UI highlighting. (@abdrhmniqbal)
- Top-tracks timespan picker with chart update time display. (@abdrhmniqbal)
- Album artist metadata support. (@abdrhmniqbal)
- Play and shuffle buttons on artist detail page. (@abdrhmniqbal)
- Expanded media action sheets across library views and improved track action sheet design. (@abdrhmniqbal)
- Reorderable and toggleable library tabs via settings. (@abdrhmniqbal)
- Force-update mixes action with danger dialog. (@abdrhmniqbal)
- Reset search history option in settings. (@abdrhmniqbal)
- User feedback feature. (@abdrhmniqbal)
- Polled progress for time indicator. (@abdrhmniqbal)
- Fallback to lrclib API when local lyrics are missing. (@abdrhmniqbal)
- Lyrics now extracted and persisted during indexing rather than at playback runtime. (@abdrhmniqbal)

### ⚙️ Changed

- Rewrote playback stack and removed legacy session engine. (@abdrhmniqbal)
- Rewrote Last.fm auth to route through Elysia proxy service. (@abdrhmniqbal)
- Migrated to `react-native-audio-browser` from `react-native-audio-api`. (@abdrhmniqbal)
- Upgraded Expo to SDK 56. (@abdrhmniqbal)
- Migrated linting and formatting to oxlint and oxfmt. (@abdrhmniqbal)
- Migrated package manager to nub. (@abdrhmniqbal)
- Large-scale refactor of player, indexer, settings, bootstrap, and shared repositories. (@abdrhmniqbal)
- Smoothed crossfade volume ramps with easeInOutCubic curve and 50ms interval. (@abdrhmniqbal)
- Direction-aware entering/exiting animations for library tabs with slide transition on tab change. (@abdrhmniqbal)
- Added icons to player action menu. (@abdrhmniqbal)
- Deferred cached track loading and startup scan for better performance. (@abdrhmniqbal)
- Made `renderItem` stable for queue view. (@abdrhmniqbal)
- Redesigned track metadata sheet UI. (@abdrhmniqbal)
- Redesigned Last.fm integration flow with shared bottom-sheet inputs. (@abdrhmniqbal)
- Refined backup UI flow and consolidated automatic backup options. (@abdrhmniqbal)
- Redesigned settings layout by intent grouping. (@abdrhmniqbal)
- Split themes into separate files and improved rainbow color contrast. (@abdrhmniqbal)
- Removed outer border boxes on settings to match borderless style. (@abdrhmniqbal)
- Refined What's New typography. (@abdrhmniqbal)

### 🧩 Fixed

- Shuffle state when starting playback with shuffle enabled. (@abdrhmniqbal)
- Player queue rendering, shuffle settings, history scrobbling, and playlist form layout. (@abdrhmniqbal)
- Clean playback queue context labels. (@abdrhmniqbal)
- Map played-from `queueContext` in store subscriber. (@abdrhmniqbal)
- Preserve playback on reopen. (@abdrhmniqbal)
- Restore startup playback and settings state. (@abdrhmniqbal)
- Duplicate mix visual presets. (@abdrhmniqbal)
- Random blank screen after navigation by disabling `freezeOnBlur`. (@abdrhmniqbal)
- Playlist form track list scrollable. (@abdrhmniqbal)
- Prevent local track artwork from overwriting Last.fm artist artwork. (@abdrhmniqbal)
- Split albums by effective album artist. (@abdrhmniqbal)
- Preserve Last.fm artist artwork during recount. (@abdrhmniqbal)
- Autocorrect Last.fm lookups and drop invalid fallback art. (@abdrhmniqbal)
- Ignore Last.fm placeholder images and scrape real page artwork. (@abdrhmniqbal)
- Gate Last.fm refresh by scan mode. (@abdrhmniqbal)
- Provide user-agent for Last.fm scrape and fallback properly. (@abdrhmniqbal)
- Switch Last.fm auth to mobile flow. (@abdrhmniqbal)
- Move restore backup to final step without redundant CTA. (@abdrhmniqbal)
- Duplicate unsplit artist entries in indexer. (@abdrhmniqbal)
- Improve artist detail overlay contrast. (@abdrhmniqbal)
- Speed up external file playback handoff. (@abdrhmniqbal)
- Enforce sleep timer track-end and play-count playback stop. (@abdrhmniqbal)
- Preserve playback when app is dismissed. (@abdrhmniqbal)
- Register Startune Music deep-link scheme. (@abdrhmniqbal)
- Restore notification player deep-link. (@abdrhmniqbal)
- Correct repeat mode behavior at queue end and on manual skips. (@abdrhmniqbal)
- Parse indexed metadata year from date-like values. (@abdrhmniqbal)
- Stabilize queue sync and trim bootstrap. (@abdrhmniqbal)
- `recycleItems` warning on LegendList. (@abdrhmniqbal)
- Strip malformed UTF-16 prefix at source in lyrics. (@abdrhmniqbal)
- Build issues caused by missing generated files and invalid media3 version. (@abdrhmniqbal)
- CI build lifecycle difference from nub. (@abdrhmniqbal)

## [v0.3.0] - 2026-05-03

### ✨ Added

- Help Translate entry in About settings with Crowdin integration groundwork. (@abdrhmniqbal)

### ⚙️ Changed

- Simplified What's New experience; release notes now sourced from GitHub Releases and repository `CHANGELOG.md`. (@abdrhmniqbal)
- Refined player and sleep timer layouts for better spacing, stability, and clearer timer state messaging. (@abdrhmniqbal)
- Improved lyrics rendering for timed karaoke markup and wrapped word handling. (@abdrhmniqbal)
- Prepared translation resources and workflow structure for Crowdin-based community localization. (@abdrhmniqbal)

### 🧩 Fixed

- Karaoke wrapping no longer shows leading spaces or splits joined lyric fragments incorrectly. (@abdrhmniqbal)
- Custom sleep timer selection now applies only after confirmation. (@abdrhmniqbal)
- Update notification tapping opens latest version popup correctly. (@abdrhmniqbal)
- Release-note workflow issues around changelog-driven content generation for manual releases. (@abdrhmniqbal)

## [v0.3.0-rc.5] - 2026-05-02

### ✨ Added

- Sleep timer settings to customize auto-stop behavior. (@abdrhmniqbal)
- Customizable "count as played" threshold value. (@abdrhmniqbal)

### ⚙️ Changed

- Improved player layout with refined controls and better spacing. (@abdrhmniqbal)
- Enhanced timed markup word normalization in lyrics processing for better karaoke handling. (@abdrhmniqbal)
- Refined sleep timer option layout: right-side controls aligned within option blocks, spacing improved near destructive actions. (@abdrhmniqbal)
- App changelog now sourced from repository `CHANGELOG.md` as primary release-note feed. (@abdrhmniqbal)
- Removed unnecessary lyrics view, search route, and timer scroll reset effects. (@abdrhmniqbal)
- Deferred database runtime sync outside render phase for better performance. (@abdrhmniqbal)

### 🧩 Fixed

- Queue view no longer remounts on track change, preventing previous tracks from disappearing. (@abdrhmniqbal)
- Changelog filtering now limits visible notes to versions at or below installed app version. (@abdrhmniqbal)
- Lyrics screen crash when lyrics unavailable. (@abdrhmniqbal)
- Scale loader animation sometimes not animating. (@abdrhmniqbal)
- Update checker not detecting available versions properly. (@abdrhmniqbal)
- External player integration not working correctly. (@abdrhmniqbal)

## [v0.3.0-rc.4] - 2026-04-30

### ✨ Added

- App update checker. (@abdrhmniqbal)
- Open source license screen. (@abdrhmniqbal)

### ⚙️ Changed

- Improved realtime lyrics performance. (@abdrhmniqbal)
- Improved artwork caching. (@abdrhmniqbal)
- Filter chip on favorites list now hides when no items available. (@abdrhmniqbal)

### 🧩 Fixed

- Split multiple values not recognizing keyboard input. (@abdrhmniqbal)
- External audio intent handling. (@abdrhmniqbal)
- Metro config error. (@abdrhmniqbal)

## [v0.3.0-rc.3] - 2026-04-29

### ✨ Added

- Save queue to playlist feature. (@abdrhmniqbal)
- "Playing from" indicator on player. (@abdrhmniqbal)
- Track count sort on genres list. (@abdrhmniqbal)
- Play queue based on search result. (@abdrhmniqbal)

### ⚙️ Changed

- Redesigned favorites list. (@abdrhmniqbal)
- Improved search screen consistency with other screens. (@abdrhmniqbal)
- Improved settings categorization. (@abdrhmniqbal)
- Enhanced audio playback settings with transitions and resume behavior. (@abdrhmniqbal)

### 🧩 Fixed

- Not all songs added to queue in lists with "view more" state. (@abdrhmniqbal)
- More robust indexer scan configuration. (@abdrhmniqbal)
- External audio playback handling. (@abdrhmniqbal)

## [v0.3.0-rc.2] - 2026-04-28

### ✨ Added

- Configurable multi-value splitting for artists and genres. (@abdrhmniqbal)
- More language options. (@abdrhmniqbal)
- Incremental indexer updates support. (@abdrhmniqbal)

### ⚙️ Changed

- Improved split multiple values settings and metadata handling. (@abdrhmniqbal)
- Improved settings page layout. (@abdrhmniqbal)
- Shuffle state now preserved; randomization applied to playback queue on track selection. (@abdrhmniqbal)

### 🧩 Fixed

- Multiple artists not shown on UI. (@abdrhmniqbal)
- Navigation issue on multiple value picker. (@abdrhmniqbal)
- Search not working properly. (@abdrhmniqbal)
- Artist artwork not uniform across all screens. (@abdrhmniqbal)
- Queue reset on track change in queue list. (@abdrhmniqbal)
- Use default indexer notification icon tint. (@abdrhmniqbal)
- Deep-link unmatched route for external file intents. (@abdrhmniqbal)
- Gradle clean dist dir before APK copy in CI. (@abdrhmniqbal)

## [v0.3.0-rc.1] - 2026-04-27

### ✨ Added

- i18n internationalization for multiple languages. (@abdrhmniqbal)
- Audio crossfade configuration. (@abdrhmniqbal)
- Advanced setting to reset listening history with confirmation before clearing history and play counts. (@abdrhmniqbal)
- Session-only player lyric preferences for karaoke mode and zoom level. (@abdrhmniqbal)

### ⚙️ Changed

- Crossfade setting now applied to playback. (@abdrhmniqbal)
- Refactored audio playback to use `react-native-audio-api`. (@abdrhmniqbal)
- Improved indexer throughput: reduced repeated database relation lookups and genre visual scans during batch processing. (@abdrhmniqbal)
- Logging verbosity now respects minimal and extra settings more consistently across runtime flows. (@abdrhmniqbal)
- Player and app notification icons now use visible white notification assets. (@abdrhmniqbal)

### 🧩 Fixed

- Attach generated release notes to CI. (@abdrhmniqbal)
- Audio open intents support. (@abdrhmniqbal)
- Stabilized artist header actions. (@abdrhmniqbal)
- Aligned track list action spacing. (@abdrhmniqbal)
- Cached resolved lyric sources. (@abdrhmniqbal)
- Handle completed indexer notification taps. (@abdrhmniqbal)
- Support angle-bracket timed embedded lyrics. (@abdrhmniqbal)
- Support embedded timed markup lyrics. (@abdrhmniqbal)
- Sort playlist detail tracks properly. (@abdrhmniqbal)
- Align indexer notification icon. (@abdrhmniqbal)
- Notification icon uniformity. (@abdrhmniqbal)
- Missing track detail queries now return `null` instead of `undefined`, keeping React Query stable after local file deletion. (@abdrhmniqbal)
- Search focus and input transition timing now runs sequentially to avoid intermittent overlap with back button. (@abdrhmniqbal)
- Player drag-to-close now only responds from drag handle instead of entire interface. (@abdrhmniqbal)
- Duplicate rapid taps to same navigation target ignored during route transitions. (@abdrhmniqbal)
- Decorative playlist and folder row chevrons no longer block row navigation taps. (@abdrhmniqbal)
- Back button on detail screens no longer requires two taps. (@abdrhmniqbal)

## [v0.2.2] - 2026-04-25

### ✨ Added

- Dedicated full-player route with zoom-style presentation and updated player header. (@abdrhmniqbal)
- "Recently Added" search destination for browsing newly indexed tracks. (@abdrhmniqbal)
- Playback session snapshots with queue cursor persistence, restoring listening state more accurately after app restarts. (@abdrhmniqbal)
- Track counts on genre cards for quicker library scanning. (@abdrhmniqbal)
- Shared themed refresh control adopted across major screens for consistent pull-to-refresh behavior. (@abdrhmniqbal)

### ⚙️ Changed

- Refined album, artist, playlist, and player transitions with shared zoom presentation and cleaner stack presets. (@abdrhmniqbal)
- Reworked search screen composition, keyboard handling, and embedded back-button behavior. (@abdrhmniqbal)
- Refreshed home, library, settings, and shared UI surfaces as part of broader visual redesign. (@abdrhmniqbal)
- Improved track list and queue item state handling: selection, identity, and playback state updates are now more predictable. (@abdrhmniqbal)
- Enhanced playback activity tracking: play counts and listening history recorded more reliably. (@abdrhmniqbal)
- Upgraded `heroui-native` and aligned transition-related dependencies with new navigation setup. (@abdrhmniqbal)

### 🧩 Fixed

- Detail-screen back navigation no longer requires two taps in some transition flows. (@abdrhmniqbal)
- Intermittent overlap between search back button and typed query text during focus/transition timing. (@abdrhmniqbal)
- Recent-search playlist artwork now shows expected multi-image collage. (@abdrhmniqbal)
- Zoom-transition backgrounds rendering correctly during transparent presentation flows. (@abdrhmniqbal)
- Removed extraneous screen declarations from Home route layout, eliminating Expo Router "Too many screens defined" warnings. (@abdrhmniqbal)
- Back button overlapping search input. (@abdrhmniqbal)
- Playlist artwork on recent searches showing only one image. (@abdrhmniqbal)
- Background not visible on zoom transition. (@abdrhmniqbal)

## [v0.2.1] - 2026-04-16

### ✨ Added

- Shared `LegendList` behavior hook for unified scroll-reset and list ref wiring across core list/grid blocks. (@abdrhmniqbal)
- Shared query invalidation helper to standardize multi-key invalidation fan-out. (@abdrhmniqbal)

### ⚙️ Changed

- Playlist form orchestration extracted into dedicated domain hook; route-level composition simplified. (@abdrhmniqbal)
- Playlist picker selection handling unified for player and track action sheets via shared module hook. (@abdrhmniqbal)
- Track mapping paths consolidated so history and playlist track mapping reuse shared DB-to-domain transformer. (@abdrhmniqbal)
- Query invalidation in favorites, history, indexer, playlist, and tracks modules now uses one invalidation utility path. (@abdrhmniqbal)

### 🧩 Fixed

- Removed duplicate navigation/tab bars on search detail screens (album, artist, playlist) by hiding parent search-stack headers for nested detail route groups. (@abdrhmniqbal)

## [v0.2.0] - 2026-04-10

### ✨ Added

- "Recently Added" tracks on Search home screen. (@abdrhmniqbal)
- Recent search history with richer search targets (albums, artists, playlists). (@abdrhmniqbal)
- Search detail routes for albums, artists, and playlists. (@abdrhmniqbal)
- Genre browsing as a first-class Library tab. (@abdrhmniqbal)
- Indexer run snapshots, retry/backoff handling, scoped commit retries, and manual completion timing. (@abdrhmniqbal)

### ⚙️ Changed

- Major internal rewrite of player, bootstrap, indexer, routes, and shared module boundaries. (@abdrhmniqbal)
- Simplified player session restore and foreground sync behavior for better long-background recovery. (@abdrhmniqbal)
- Tightened shared typing across player adapters, playlist utilities, sort helpers, and player UI support code. (@abdrhmniqbal)
- Streamlined high-traffic list and screen render paths. (@abdrhmniqbal)
- Removed skeleton loading UIs across app screens in favor of direct offline-friendly content and empty states. (@abdrhmniqbal)
- Enhanced layout and performance of grid and list components. (@abdrhmniqbal)
- Improved playback session restoration. (@abdrhmniqbal)

### 🧩 Fixed

- Shuffle and queue updates no longer interrupt active playback. (@abdrhmniqbal)
- Playback state transitions more stable when switching tracks from lists. (@abdrhmniqbal)
- Search and detail routing behavior more consistent. (@abdrhmniqbal)
- Artwork fallback more consistent across track, album, and artist surfaces. (@abdrhmniqbal)
- Indexer notifications and foreground autoscan timing more reliable. (@abdrhmniqbal)
- Genre-related screens visibility. (@abdrhmniqbal)
- Artist image fallback on album lists. (@abdrhmniqbal)
- Native repeat mode preservation across queue resets. (@abdrhmniqbal)
- Shuffle queue updates using native state enum. (@abdrhmniqbal)
- Stale "preparing" notification overwriting completion. (@abdrhmniqbal)
- Playback state issues. (@abdrhmniqbal)

## [v0.2.0-rc.2] - 2026-04-02

### ✨ Added

- System notification controls for indexing progress with pause, resume, cancel, and open-library actions. (@abdrhmniqbal)
- Google Cast controls in the full player. (@abdrhmniqbal)
- Expanded runtime and route diagnostics for bootstrap, player queue, and media permission flows. (@abdrhmniqbal)

### ⚙️ Changed

- Improved navigation transitions and shared stack configuration for media detail routes. (@abdrhmniqbal)
- Reduced hot-screen store subscriptions and unnecessary playback/list rerenders. (@abdrhmniqbal)
- Continued rewrite: separated bootstrap listener registration, playback helpers, indexer orchestration, and shared UI list wiring. (@abdrhmniqbal)
- Parallelized metadata extraction and artwork caching for faster indexing. (@abdrhmniqbal)

### 🧩 Fixed

- Background playback and foreground autoscan freeze. (@abdrhmniqbal)
- Player state resync after shuffle and skip flows. (@abdrhmniqbal)
- Artist artwork fallback consistency between tabs and detail screens. (@abdrhmniqbal)
- Incremental indexing responsiveness and history refresh after playback activity. (@abdrhmniqbal)
- Progress indexer notification spamming. (@abdrhmniqbal)
- Repeated media permission prompts during autoscan. (@abdrhmniqbal)

## [v0.2.0-rc.1] - 2026-03-28

### ✨ Added

- Basic synchronized lyrics support for embedded lyrics, `.lrc`, and TTML lyrics. (@abdrhmniqbal)
- Structured logging across runtime workflows. (@abdrhmniqbal)
- Rewrite planning and module-boundary documentation. (@abdrhmniqbal)

### ⚙️ Changed

- Large-scale refactor of player, indexer, settings, bootstrap, and shared repositories/services. (@abdrhmniqbal)
- Settings and local preferences consolidated into clearer module ownership. (@abdrhmniqbal)
- Player session persistence, queue/runtime control, and theme/file helpers separated into dedicated modules. (@abdrhmniqbal)

### 🧩 Fixed

- Repeated media permission prompts during autoscan. (@abdrhmniqbal)
- Home history refresh after playback activity. (@abdrhmniqbal)
- Duplicate player/indexer adapters and compatibility-layer leftovers. (@abdrhmniqbal)

## [v0.1.0] - 2026-03-12

### ✨ Added

- Offline local music playback with queue, repeat, shuffle, seeking, and background playback. (@abdrhmniqbal)
- Library browsing for tracks, albums, artists, genres, favorites, folders, and playlists. (@abdrhmniqbal)
- Playlist creation, editing, reordering, and track action sheet playlist flows. (@abdrhmniqbal)
- Full-player UI, mini player, queue view, artist and album detail screens, and favorites across item types. (@abdrhmniqbal)
- Folder filters, track-duration filters, force reindex, autoscan, battery optimization, and logging controls. (@abdrhmniqbal)
- Track metadata inspection, removable local files, and richer artwork-based player visuals. (@abdrhmniqbal)

### ⚙️ Changed

- Major UI redesign across home, library, search, album, artist, playlist, player, mini player, settings, and indexing progress. (@abdrhmniqbal)
- Adopted Expo Router, bottom-sheet based full-player flows, and HeroUI-based controls. (@abdrhmniqbal)

### 🧩 Fixed

- Search route handling, navigation history, queue sorting, playback resume, indexing updates, and list padding/touch issues. (@abdrhmniqbal)
- Artist image fallback and genre metadata handling. (@abdrhmniqbal)

## [v0.1.0-rc.3] - 2026-03-02

### ✨ Added

- About screen. (@abdrhmniqbal)

### 🧩 Fixed

- History not recorded on track repeat. (@abdrhmniqbal)
- Track action sheet not shown on first long-press in track list. (@abdrhmniqbal)
- Bottom padding on list-related components. (@abdrhmniqbal)
- Album artist metadata never indexed. (@abdrhmniqbal)
- History not recorded for manual track selection. (@abdrhmniqbal)
- Route unable to escape special characters properly. (@abdrhmniqbal)
- Folder filters applied without confirming. (@abdrhmniqbal)
- List not refreshed immediately after applying filters. (@abdrhmniqbal)

## [v0.1.0-rc.2] - 2026-02-28

### ✨ Added

- Player action sheet. (@abdrhmniqbal)
- Full-player bottom sheet. (@abdrhmniqbal)
- Add tracks to playlist from track action sheet. (@abdrhmniqbal)
- Playlist item reordering. (@abdrhmniqbal)
- Queue list reordering. (@abdrhmniqbal)
- Battery optimization settings. (@abdrhmniqbal)

### ⚙️ Changed

- Restructured settings page. (@abdrhmniqbal)
- Full-player UI improvements. (@abdrhmniqbal)
- Track action sheet improvements. (@abdrhmniqbal)
- Improved user experience on playlist form. (@abdrhmniqbal)
- Upgraded HeroUI sliders. (@abdrhmniqbal)

### 🧩 Fixed

- Inconsistent interface elements. (@abdrhmniqbal)
- Notification click not matching correct route. (@abdrhmniqbal)
- Color contrast on full-player background. (@abdrhmniqbal)
- Notification icon issues. (@abdrhmniqbal)
- Open file functionality. (@abdrhmniqbal)
- Sort logic not handling special characters properly. (@abdrhmniqbal)
- Selected items not showing on track picker sheet. (@abdrhmniqbal)
- Sort value case sensitivity. (@abdrhmniqbal)
- Database init blocking. (@abdrhmniqbal)
- Playback session persistence. (@abdrhmniqbal)
- Bottom nav not hidden while scrolling on library tabs. (@abdrhmniqbal)
- Tab reset on clear input at search screen. (@abdrhmniqbal)
- Albums and artists not filtered properly. (@abdrhmniqbal)

## [v0.1.0-rc.1] - 2026-02-19

### ✨ Added

- Initial project setup and basic UI scaffolding. (@abdrhmniqbal)
- Local library indexing and playback foundations. (@abdrhmniqbal)
- Early iterations of queueing, sorting, and favorites. (@abdrhmniqbal)
