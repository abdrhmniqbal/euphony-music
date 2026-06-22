# Changelog

All notable changes to this project are documented in this file.

## [v0.3.0] - 2026-05-03

### ✨ New Features

- Help Translate entry in About settings with Crowdin integration groundwork. (@abdrhmniqbal)

### ⚙️ Changes

- Simplified What's New experience and aligned release-note sourcing with GitHub Releases and repository `CHANGELOG.md`. (@abdrhmniqbal)
- Refined player and sleep timer layouts for better spacing, stability, and clearer timer state messaging. (@abdrhmniqbal)
- Improved lyrics rendering for timed karaoke markup and wrapped word handling. (@abdrhmniqbal)
- Prepared translation resources and workflow structure for Crowdin-based community localization. (@abdrhmniqbal)

### 🧩 Fixes

- Fixed karaoke wrapping issues that could show leading spaces or split joined lyric fragments incorrectly. (@abdrhmniqbal)
- Fixed custom sleep timer selection behavior so the chosen time is only applied after confirmation. (@abdrhmniqbal)
- Fixed update notification behavior so tapping it opens the latest version popup correctly. (@abdrhmniqbal)
- Fixed release-note workflow issues around changelog-driven content generation for manual releases. (@abdrhmniqbal)

## [v0.3.0-rc.5] - 2026-05-02

### ✨ New Features

- Sleep timer settings to customize auto-stop behavior. (@abdrhmniqbal)
- Ability to customize "count as played" threshold value. (@abdrhmniqbal)

### ⚙️ Changes

- Improved player layout with refined controls and better spacing. (@abdrhmniqbal)
- Enhanced timed markup word normalization in lyrics processing for better karaoke handling. (@abdrhmniqbal)
- Refined sleep timer option layout by aligning right-side controls within option blocks and improving spacing near destructive actions. (@abdrhmniqbal)
- Updated app changelog sourcing to use repository `CHANGELOG.md` as the primary release-note feed. (@abdrhmniqbal)
- Removed unnecessary lyrics view, search route, and timer scroll reset effects. (@abdrhmniqbal)
- Deferred database runtime sync outside render phase for better performance. (@abdrhmniqbal)

### 🧩 Fixes

- Queue view no longer remounts on track change, preventing previous tracks from disappearing in the queue panel. (@abdrhmniqbal)
- Changelog filtering now limits visible notes to versions at or below the installed app version. (@abdrhmniqbal)
- Lyrics screen crash when lyrics weren't available. (@abdrhmniqbal)
- Scale loader animation sometimes not animated. (@abdrhmniqbal)
- Update checker logic not properly detecting available versions. (@abdrhmniqbal)
- External player integration not working correctly. (@abdrhmniqbal)

## [v0.3.0-rc.4] - 2026-04-30

### ✨ New Features

- App update checker feature. (@abdrhmniqbal)
- Open source license screen. (@abdrhmniqbal)

### ⚙️ Changes

- Improved realtime lyrics performance. (@abdrhmniqbal)
- Improved artwork caching. (@abdrhmniqbal)
- Filter chip display on favorites list to only show when items are not empty. (@abdrhmniqbal)

### 🧩 Fixes

- Split multiple values not recognizing keyboard input. (@abdrhmniqbal)
- External audio intent handling. (@abdrhmniqbal)
- Metro config error. (@abdrhmniqbal)

## [v0.3.0-rc.3] - 2026-04-29

### ✨ New Features

- Save queue to playlist feature. (@abdrhmniqbal)
- Playing from indicator on player. (@abdrhmniqbal)
- Number of tracks sort on genres list. (@abdrhmniqbal)
- Play queue based on search result. (@abdrhmniqbal)

### ⚙️ Changes

- Redesign favorites list. (@abdrhmniqbal)
- Improved search screen consistency with other screens. (@abdrhmniqbal)
- Improve settings categorization. (@abdrhmniqbal)
- Enhanced audio playback settings with transitions and resume behavior. (@abdrhmniqbal)

### 🧩 Fixes

- Not all songs added to queue in list with view more state. (@abdrhmniqbal)
- Implement more robust indexer scan configuration. (@abdrhmniqbal)
- External audio playback handling. (@abdrhmniqbal)

## [v0.3.0-rc.2] - 2026-04-28

### ✨ New Features

- Configurable multi-value splitting for artists and genres. (@abdrhmniqbal)
- More language options. (@abdrhmniqbal)
- Incremental indexer updates support. (@abdrhmniqbal)

### ⚙️ Changes

- Improved split multiple values settings. (@abdrhmniqbal)
- Enhanced split metadata handling. (@abdrhmniqbal)
- Improved settings page layout. (@abdrhmniqbal)
- Preserve shuffle state and apply randomization to playback queue on track selection. (@abdrhmniqbal)

### 🧩 Fixes

- Multiple artists are not shown on UI. (@abdrhmniqbal)
- Navigation issue on multiple value picker. (@abdrhmniqbal)
- Search not working properly. (@abdrhmniqbal)
- Artist artwork aren't uniform on all screens. (@abdrhmniqbal)
- Queue reset on track change in queue list. (@abdrhmniqbal)
- Use default indexer notification icon tint. (@abdrhmniqbal)
- Deep-link unmatched route for external file intents. (@abdrhmniqbal)
- Gradle clean dist dir before apk copy in CI. (@abdrhmniqbal)

## [v0.3.0-rc.1] - 2026-04-27

### ✨ New Features

- i18n internationalization support for multiple languages. (@abdrhmniqbal)
- Audio crossfade configuration. (@abdrhmniqbal)
- Advanced setting to reset listening history with confirmation before clearing history and play counts. (@abdrhmniqbal)
- Session-only player lyric preferences for karaoke mode and lyric zoom level. (@abdrhmniqbal)

### ⚙️ Changes

- Apply crossfade setting to playback. (@abdrhmniqbal)
- Refactor audio playback to use react-native-audio-api. (@abdrhmniqbal)
- Improved indexer throughput by reducing repeated database relation lookups and genre visual scans during batch processing. (@abdrhmniqbal)
- Logging verbosity now respects minimal and extra settings more consistently across runtime flows. (@abdrhmniqbal)
- Player and app notification icons now use visible white notification assets. (@abdrhmniqbal)

### 🧩 Fixes

- Attach generated release notes to CI. (@abdrhmniqbal)
- Add audio open intents support. (@abdrhmniqbal)
- Stabilize artist header actions. (@abdrhmniqbal)
- Align track list action spacing. (@abdrhmniqbal)
- Cache resolved lyric sources. (@abdrhmniqbal)
- Handle completed indexer notification taps. (@abdrhmniqbal)
- Support angle timed embedded lyrics. (@abdrhmniqbal)
- Support embedded timed markup lyrics. (@abdrhmniqbal)
- Sort playlist detail tracks properly. (@abdrhmniqbal)
- Align indexer notification icon. (@abdrhmniqbal)
- Notification icon uniformity. (@abdrhmniqbal)
- Missing track detail queries now return `null` instead of undefined so React Query remains stable after local file deletion. (@abdrhmniqbal)
- Search focus and input transition timing now runs in sequence to avoid intermittent input overlap with the back button. (@abdrhmniqbal)
- Player drag-to-close now only responds from the drag handle instead of the whole interface. (@abdrhmniqbal)
- Duplicate rapid taps to the same navigation target are ignored during route transitions. (@abdrhmniqbal)
- Decorative playlist and folder row chevrons no longer block row navigation taps. (@abdrhmniqbal)
- Back button on details screen requiring two taps (reverted screen transitions). (@abdrhmniqbal)

## [v0.2.2] - 2026-04-25

### ✨ New Features

- Dedicated full player route with zoom-style presentation and updated player header behavior. (@abdrhmniqbal)
- Recently Added search destination for browsing newly indexed tracks from the Search area. (@abdrhmniqbal)
- Playback session snapshots with queue cursor persistence to restore listening state more accurately after app restarts. (@abdrhmniqbal)
- Track counts on genre cards for quicker library scanning. (@abdrhmniqbal)
- Shared themed refresh control adopted across major screens for more consistent pull-to-refresh behavior. (@abdrhmniqbal)

### ⚙️ Changes

- Refined album, artist, playlist, and player transitions with shared zoom presentation, cleaner stack presets, and follow-up visual polish. (@abdrhmniqbal)
- Reworked search screen composition, keyboard handling, and embedded back-button behavior to better support focused queries and detail navigation. (@abdrhmniqbal)
- Refreshed home, library, settings, and shared UI surfaces as part of the broader visual redesign pass. (@abdrhmniqbal)
- Improved track list and queue item state handling to keep selection, identity, and playback state updates more predictable. (@abdrhmniqbal)
- Enhanced playback activity tracking so play counts and listening history are recorded more reliably. (@abdrhmniqbal)
- Upgraded `heroui-native` and aligned transition-related dependencies with the new navigation setup. (@abdrhmniqbal)

### 🧩 Fixes

- Fixed detail-screen back navigation requiring two taps in some transition flows. (@abdrhmniqbal)
- Fixed intermittent overlap between the search back button and typed query text during focus and transition timing. (@abdrhmniqbal)
- Fixed recent-search playlist artwork rendering so playlist entries use the expected multi-image collage. (@abdrhmniqbal)
- Fixed zoom-transition backgrounds not rendering correctly during transparent presentation flows. (@abdrhmniqbal)
- Removed extraneous screen declarations from the Home route layout to eliminate Expo Router "Too many screens defined" warnings. (@abdrhmniqbal)
- Fixed back button overlapping on search input. (@abdrhmniqbal)
- Fixed playlist artwork on recent searches showing only one image. (@abdrhmniqbal)
- Fixed background not visible on zoom transition. (@abdrhmniqbal)

## [v0.2.1] - 2026-04-16

### ✨ New Features

- Shared LegendList behavior hook for unified scroll-reset and list ref wiring across core list/grid blocks. (@abdrhmniqbal)
- Shared query invalidation helper to standardize multi-key invalidation fan-out. (@abdrhmniqbal)

### ⚙️ Changes

- Extracted playlist form orchestration into a dedicated domain hook and simplified route-level composition. (@abdrhmniqbal)
- Unified playlist picker selection handling for player and track action sheets through a shared module hook. (@abdrhmniqbal)
- Consolidated track mapping paths so history and playlist track mapping reuse the shared DB-to-domain transformer. (@abdrhmniqbal)
- Refactored query invalidation in favorites, history, indexer, playlist, and tracks modules to use one invalidation utility path. (@abdrhmniqbal)

### 🧩 Fixes

- Removed duplicate navigation/tab bars on search detail screens (album, artist, playlist) by hiding parent search-stack headers for nested detail route groups. (@abdrhmniqbal)
- Prevented duplicate bars on search details. (@abdrhmniqbal)

## [v0.2.0] - 2026-04-10

### ✨ New Features

- Recently added tracks on the Search home screen. (@abdrhmniqbal)
- Recent search history with richer search targets for albums, artists, and playlists. (@abdrhmniqbal)
- Search detail routes for albums, artists, and playlists. (@abdrhmniqbal)
- Genre browsing as a first-class Library tab. (@abdrhmniqbal)
- Indexer run snapshots, retry/backoff handling, scoped commit retries, and manual completion timing. (@abdrhmniqbal)

### ⚙️ Changes

- Completed a major internal rewrite of the player, bootstrap, indexer, routes, and shared module boundaries. (@abdrhmniqbal)
- Simplified player session restore and foreground sync behavior for better long-background recovery. (@abdrhmniqbal)
- Tightened shared typing across player adapters, playlist utilities, sort helpers, and player UI support code. (@abdrhmniqbal)
- Streamlined high-traffic list and screen render paths. (@abdrhmniqbal)
- Removed skeleton loading UIs across app screens in favor of direct offline-friendly content and empty states. (@abdrhmniqbal)
- Enhanced layout and performance of grid and list components. (@abdrhmniqbal)
- Improved playback session restoration. (@abdrhmniqbal)

### 🧩 Fixes

- Shuffle and queue updates no longer interrupt active playback. (@abdrhmniqbal)
- Playback state transitions are more stable when switching tracks from lists. (@abdrhmniqbal)
- Search and detail routing behavior is more consistent. (@abdrhmniqbal)
- Artwork fallback behavior is more consistent across track, album, and artist surfaces. (@abdrhmniqbal)
- Indexer notifications and foreground autoscan timing are more reliable. (@abdrhmniqbal)
- Fixed genre related screens visibility. (@abdrhmniqbal)
- Fixed artist image fallback behavior on album lists. (@abdrhmniqbal)
- Fixed native repeat mode preservation across queue resets. (@abdrhmniqbal)
- Fixed shuffle queue updates using native state enum. (@abdrhmniqbal)
- Fixed stale preparing notification overwriting completion. (@abdrhmniqbal)
- Fixed playback state issue. (@abdrhmniqbal)

## [v0.2.0-rc.2] - 2026-04-02

### ✨ New Features

- System notification controls for indexing progress with pause, resume, cancel, and open-library actions. (@abdrhmniqbal)
- Google Cast controls in the full player. (@abdrhmniqbal)
- Expanded runtime and route diagnostics for bootstrap, player queue, and media permission flows. (@abdrhmniqbal)

### ⚙️ Changes

- Improved navigation transitions and shared stack configuration for media detail routes. (@abdrhmniqbal)
- Reduced hot-screen store subscriptions and unnecessary playback/list rerenders. (@abdrhmniqbal)
- Continued the rewrite by separating bootstrap listener registration, playback helpers, indexer orchestration, and shared UI list wiring. (@abdrhmniqbal)
- Parallelize metadata extraction and artwork caching for faster indexing. (@abdrhmniqbal)

### 🧩 Fixes

- Background playback and foreground autoscan freeze issues. (@abdrhmniqbal)
- Player state resync issues after shuffle and skip flows. (@abdrhmniqbal)
- Artist artwork fallback consistency between tabs and detail screens. (@abdrhmniqbal)
- Incremental indexing responsiveness and history refresh behavior. (@abdrhmniqbal)
- Progress indexer notification spamming. (@abdrhmniqbal)
- Repeated media permission prompts during autoscan. (@abdrhmniqbal)
- Home history refresh after playback activity. (@abdrhmniqbal)

## [v0.2.0-rc.1] - 2026-03-28

### ✨ New Features

- Basic synchronized lyrics support for embedded lyrics, `.lrc`, and TTML lyrics. (@abdrhmniqbal)
- Structured logging across runtime workflows. (@abdrhmniqbal)
- Rewrite planning and module-boundary documentation. (@abdrhmniqbal)

### ⚙️ Changes

- Large-scale refactor of player, indexer, settings, bootstrap, and shared repositories/services. (@abdrhmniqbal)
- Settings and local preferences were consolidated into clearer module ownership. (@abdrhmniqbal)
- Player session persistence, queue/runtime control, and theme/file helpers were separated into dedicated modules. (@abdrhmniqbal)

### 🧩 Fixes

- Repeated media permission prompts during autoscan. (@abdrhmniqbal)
- Home history refresh after playback activity. (@abdrhmniqbal)
- Duplicate player/indexer adapters and several compatibility-layer leftovers. (@abdrhmniqbal)

## [v0.1.0] - 2026-03-12

### ✨ New Features

- Offline local music playback with queue, repeat, shuffle, seeking, and background playback. (@abdrhmniqbal)
- Library browsing for tracks, albums, artists, genres, favorites, folders, and playlists. (@abdrhmniqbal)
- Playlist creation, editing, reordering, and track action sheet playlist flows. (@abdrhmniqbal)
- Rich full-player UI, mini player, queue view, artist and album detail screens, and favorites across item types. (@abdrhmniqbal)
- Folder filters, track-duration filters, force reindex, autoscan settings, battery optimization settings, and logging controls. (@abdrhmniqbal)
- Track metadata inspection improvements, removable local files, and richer artwork-based player visuals. (@abdrhmniqbal)

### ⚙️ Changes

- Major UI redesign across home, library, search, album, artist, playlist, player, mini player, settings, and indexing progress. (@abdrhmniqbal)
- Adoption of Expo Router, bottom-sheet based full player flows, and improved HeroUI-based controls. (@abdrhmniqbal)

### 🧩 Fixes

- Search route handling, navigation history, queue sorting, playback resume, indexing updates, and list padding/touch issues. (@abdrhmniqbal)
- Artist image fallback behavior and genre metadata handling. (@abdrhmniqbal)

## [v0.1.0-rc.3] - 2026-03-02

### ✨ New Features

- About screen. (@abdrhmniqbal)

### 🧩 Fixes

- History not recorded on track repeat. (@abdrhmniqbal)
- Track action sheet not shown at first long press on track list. (@abdrhmniqbal)
- Bottom padding issues on list related components. (@abdrhmniqbal)
- Album artist metadata never indexed. (@abdrhmniqbal)
- History not recorded for manual track selection. (@abdrhmniqbal)
- Route unable to escape special character properly. (@abdrhmniqbal)
- Folder filters applied without confirming. (@abdrhmniqbal)
- List not refreshed immediately after applying filters. (@abdrhmniqbal)

## [v0.1.0-rc.2] - 2026-02-28

### ✨ New Features

- Player action sheet. (@abdrhmniqbal)
- Full player bottom sheet. (@abdrhmniqbal)
- Ability to add tracks to playlist on track action sheet. (@abdrhmniqbal)
- Playlist item reordering. (@abdrhmniqbal)
- Queue list reordering. (@abdrhmniqbal)
- Battery optimization settings. (@abdrhmniqbal)

### ⚙️ Changes

- Restructured settings page. (@abdrhmniqbal)
- Improvements to full player UI. (@abdrhmniqbal)
- Improvements to track action sheet. (@abdrhmniqbal)
- Improved user experience on playlist form. (@abdrhmniqbal)
- Upgraded HeroUI sliders. (@abdrhmniqbal)

### 🧩 Fixes

- Inconsistent interface elements. (@abdrhmniqbal)
- Notification click not matched route. (@abdrhmniqbal)
- Color contrast on full player background. (@abdrhmniqbal)
- Notification icon issues. (@abdrhmniqbal)
- Open file functionality. (@abdrhmniqbal)
- Sort logic not handling special character properly. (@abdrhmniqbal)
- Selected items not showing on track picker sheet. (@abdrhmniqbal)
- Sort value case sensitivity. (@abdrhmniqbal)
- Database init blocking. (@abdrhmniqbal)
- Playback session persistence. (@abdrhmniqbal)
- Bottom nav not hidden while scrolling on library tabs. (@abdrhmniqbal)
- Tab reset on clear input at search screen. (@abdrhmniqbal)
- Albums and artists not filtered properly. (@abdrhmniqbal)

## [v0.1.0-rc.1] - 2026-02-19

### ✨ New Features

- Initial project setup and basic UI scaffolding. (@abdrhmniqbal)
- Local library indexing and playback foundations. (@abdrhmniqbal)
- Early iterations of queueing, sorting, and favorites. (@abdrhmniqbal)
