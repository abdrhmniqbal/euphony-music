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
| P12 | Settings        | hub + all sub-screens, backup/restore, auto-backup                                                                                                          | backup round-trip test        |
| P13 | Integrations    | Last.fm scrobble/bio/artwork, Deezer artwork cache, Cast, widget, updates, about/licenses/whats-new, notification click routing polish                      | version-compare tests         |

Phases may be split further while implementing; each commit stays revertable.

## Working agreement

- Port logic feature-by-feature from `src_dep/` but rewrite it against the new architecture; do not copy-paste modules wholesale.
- When legacy behavior looks like a bug, flag it before porting it.
- Old tests in `src_dep/**/__tests__` are reference material; re-add relevant ones per phase under the new paths.
