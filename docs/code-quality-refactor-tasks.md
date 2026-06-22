# Code Quality Refactor Tasks

## Goal

Improve project maintainability without changing behavior. Refactors should delete incidental complexity, clarify ownership boundaries, and move domain policy out of UI/runtime glue.

## Guardrails

- Preserve existing behavior and routes.
- Use `pnpm` for all package/script commands.
- Keep changes surgical per task.
- Add or update tests where available for moved behavior.
- Avoid broad formatting churn.
- Prefer deleting branches/duplication over adding abstractions.
- Do not start implementation until each task has clear success criteria.

## Verification Baseline

Before and after each task, run available checks:

```bash
pnpm lint
pnpm typecheck
```

If project scripts differ, use matching `package.json` scripts.

## Task 1 — Extract library home playback policy

**Problem:** `src/modules/library/ui/home/use-library-home-state.ts` owns UI state, queries, sorting, navigation, folder state, and playback queue policy.

**Current hotspots:**

- `appendUniqueTrack`
- `buildFavoritesPlaybackQueue`
- `playFavoriteTrack`
- `playAll`
- `shuffle`

**Refactor target:**

Move favorite/library playback queue construction out of UI hook.

Suggested files:

- `src/modules/library/favorite-playback-queue.ts`
- `src/modules/library/library-playback-actions.ts`
- optional `src/modules/library/ui/home/use-library-tabs-state.ts`

**Success criteria:**

- `useLibraryHomeState` no longer builds favorite playback queues directly.
- Favorite album/artist/playlist/track playback behavior stays identical.
- Play all and shuffle behavior stays identical for Tracks/Favorites/default cases.
- UI hook becomes composition/view-model layer, not domain-policy owner.

## Task 2 — Move external-file indexing out of player service

**Problem:** `src/modules/player/service.ts` owns playback plus external media indexing, metadata extraction, artwork caching, DB writes, relation creation, and library count updates.

**Current hotspots:**

- `getOrCreateExternalArtist`
- `getOrCreateExternalAlbum`
- `getOrCreateExternalGenre`
- `updateExternalLibraryCounts`
- `indexExternalFileTrack`
- background fallback replacement inside `playExternalFileUri`

**Refactor target:**

Move external indexing/import logic to indexer or dedicated external playback module.

Suggested files:

- `src/modules/indexer/external-file-import.ts`
- or `src/modules/player/external-file-playback.ts` for player-specific orchestration only

Suggested contract:

```ts
type ExternalPlaybackResolution =
  | { kind: "indexed"; track: Track }
  | { kind: "fallback"; fallback: Track; hydrate: () => Promise<Track> };
```

**Success criteria:**

- `player/service.ts` starts playback but does not create artists/albums/genres directly.
- External file immediate fallback playback still works.
- Background metadata hydration still updates queue/active track/now playing.
- DB writes for imported external files live in indexer/import layer.

## Task 3 — Split LyricsView into source, model, scroll, render pieces

**Problem:** `src/modules/lyrics/ui/lyrics-view.tsx` mixes DB fallback, lyrics source resolution, parsing, mode selection, auto-scroll refs, and three render modes.

**Current hotspots:**

- dynamic DB fallback in query function
- `effectiveMode` derivation
- `scheduleLyricsAutoScroll` setup
- nested render branches for timed markup/static/synced lyrics

**Refactor target:**

Create focused hooks/components.

Suggested files:

- `src/modules/lyrics/use-resolved-lyrics.ts`
- `src/modules/lyrics/use-lyrics-presentation.ts`
- `src/modules/lyrics/use-lyrics-auto-scroll.ts`
- `src/modules/lyrics/ui/timed-markup-lyrics.tsx`
- `src/modules/lyrics/ui/static-lyrics.tsx`
- `src/modules/lyrics/ui/synced-lyrics.tsx`

**Success criteria:**

- UI component no longer imports DB client/schema dynamically.
- Lyric parsing and mode selection are testable outside component render.
- Auto-scroll state/timeout/layout cache are isolated.
- Timed markup, static, and synced render branches are separate components.
- Empty state and controls behave unchanged.

## Task 4 — Make playlist mutations atomic and stats-owned

**Problem:** `src/modules/playlist/repository.ts` has inconsistent transaction boundaries and stats updates.

**Current hotspots:**

- `createPlaylist` inserts playlist then tracks outside transaction.
- `addTrackToPlaylist` check/max-position/insert/stats are separate.
- `removeTrackFromPlaylist` delete/resequence/stats are separate.
- `reorderPlaylistTracks` does not update playlist timestamp/stats.

**Refactor target:**

Use transaction-scoped helpers for membership and stats.

Suggested helpers:

```ts
async function replacePlaylistTrackMembership(tx, playlistId, trackIds, now) {}
async function recomputePlaylistStats(tx, playlistId, now) {}
async function resequencePlaylistTracks(tx, playlistId) {}
```

**Success criteria:**

- Create/update/add/remove/reorder playlist mutations are transactionally consistent.
- `trackCount`, `duration`, and `updatedAt` ownership is centralized.
- Partial membership/stats state cannot be committed by normal mutation paths.
- Public repository API behavior stays unchanged.

## Task 5 — Centralize search result actions

**Problem:** `src/modules/search/ui/search-screen.tsx` duplicates result press/long-press policy across artists, albums, playlists, recent searches, action sheets, navigation, and recent-search persistence.

**Current hotspots:**

- `handleRecentItemPress`
- `handleArtistPress`
- `handleAlbumPress`
- `handlePlaylistPress`
- `handleArtistLongPress`
- `handleAlbumLongPress`
- `handlePlaylistLongPress`

**Refactor target:**

Create a data-driven search action resolver.

Suggested file:

- `src/modules/search/search-actions.ts`

Suggested contract:

```ts
type SearchAction = {
  recentSearch?: RecentSearchItem;
  route?: { pathname: string; params?: Record<string, string | undefined> };
  sheet?: CollectionActionSheetConfig;
};
```

**Success criteria:**

- Screen has one result press path and one result long-press path.
- Recent-search shape generation is centralized.
- Transition ID generation remains correct.
- Existing navigation behavior remains unchanged.

## Task 6 — Add settings registry for hydration/defaults

**Problem:** settings defaults and hydration are manually wired across `settings/store.ts`, many settings modules, and `runtime/app-runtime.tsx`.

**Current hotspots:**

- `src/modules/runtime/app-runtime.tsx` `preloadSettings()` import list
- `src/modules/settings/store.ts` default constants and getters
- repeated settings persistence modules

**Refactor target:**

Introduce a typed settings registry for defaults and hydration.

Suggested file:

- `src/modules/settings/registry.ts`

Registry scope:

- defaults
- load/ensure hydration functions
- state apply/update mapping

Do not over-genericize settings screens.

**Success criteria:**

- Runtime calls `preloadRegisteredSettings()` or equivalent.
- Adding a persisted setting does not require editing runtime preload list.
- Defaults remain typed.
- Existing settings screens and store selectors keep behavior.

## Task 7 — Replace high-risk `any` casts with typed boundaries

**Problem:** `any` casts mark unmodeled external contracts.

**Known sites:**

- `src/app/_layout.tsx` theme cast
- `src/app/settings/library-tabs.tsx` cast
- `src/components/blocks/favorites-list.tsx` casts
- `src/modules/runtime/app-runtime.tsx` playback state cast
- `src/modules/tracks/ui/track-metadata/use-track-metadata-navigation.ts` `any` params
- `src/utils/validation.ts` validators using `any`

**Refactor target:**

Add small adapters/type guards at boundaries.

Examples:

```ts
function toPlaybackState(value: string): PlaybackState | null {}
function isCollectionType(value: FavoriteType): value is CollectionType {}
type ThemeName = keyof typeof themes;
```

**Success criteria:**

- Runtime playback state cast is gone.
- Theme name cast is gone or isolated behind a typed guard.
- Favorite action sheet type cast is gone.
- Track metadata navigation params are explicitly typed.
- Validator helpers use `unknown` instead of `any`.

## Suggested Implementation Order

1. Task 4 — playlist atomicity first; safest isolated repository refactor.
2. Task 1 — library playback policy extraction; big UI simplification.
3. Task 2 — external indexing boundary; high-value architecture cleanup.
4. Task 3 — lyrics decomposition; larger UI split after patterns are clear.
5. Task 5 — search action resolver; medium-risk UI cleanup.
6. Task 7 — type boundary cleanup; can be done incrementally.
7. Task 6 — settings registry; do last because it touches many settings modules.

## Notes

- These tasks are behavior-preserving refactors, not product changes.
- Prefer one PR/phase per task.
- Each task should leave codebase simpler by deleting branches or moving ownership to canonical layer.
