# Full `src/` Refactor Roadmap v2

## Scope
Full-source audit of `src/` for structure, maintainability, future-risk logic, bad flows, type gaps, and performance risks. This plan is implementation-ready but intentionally split into small commits. Behavior must stay unchanged unless a phase explicitly fixes a verified bug.

## Current Baseline
- Branch: `master`
- Latest refactor commit at audit start: `fac0298`
- `pnpm -s exec tsc --noEmit` currently fails because of pre-existing type errors in app and dependency code.
- Biggest remaining files:
  - `src/modules/indexer/repository.ts` — 1136 lines
  - `src/modules/player/session.service.ts` — 814 lines
  - `src/components/blocks/player/action-sheet.tsx` — 773 lines
  - `src/app/(main)/(library)/index.tsx` — 753 lines
  - `src/components/blocks/player/lyrics-view.tsx` — 660 lines
  - `src/modules/indexer/metadata.ts` — 648 lines
  - `src/app/(main)/(library)/artist/[name].tsx` — 645 lines
  - `src/modules/player/service.ts` — 603 lines
  - `src/modules/lyrics/index.ts` — 581 lines
  - `src/components/blocks/track-metadata-sheet.tsx` — 522 lines

## Guardrails
- One phase = one logical commit.
- No broad rewrites.
- Prefer extracted pure helpers and hooks over new class abstractions.
- Run targeted `tsc` grep for touched files after each phase.
- Do not hide repo-wide `tsc` failures; log unrelated baseline errors separately.
- Do not commit `.agents/skills/refactor/`, `.rpiv/`, or `skills-lock.json` unless explicitly requested.

## Naming & Module Layout Policy
- Avoid dotted implementation filenames for source modules.
  - Bad: `sort.utils.ts`, `session.service.ts`, `counts.repository.ts`, `form-editor.hook.ts`.
  - Good nested module: `sort/utils.ts`, `session/service.ts`, `counts/repository.ts`, `form-editor/use-form-editor.ts`.
  - Good promoted module: `src/modules/library/sort/index.ts`, `src/modules/player/session/index.ts`.
- Keep `.d.ts` files as-is; dotted declaration names like `images.d.ts` are TypeScript convention and not targeted.
- Route filenames dictated by Expo Router are exempt when framework semantics require them, but custom route helpers should still use folders.
- Prefer domain folders over suffix-heavy filenames when a concept has 2+ files.
  - Example: `src/modules/library/sort/{constants,store,types,utils,index}.ts` instead of many `sort.*.ts` files.
- Use suffix directories for layers, not suffix filenames, when promoting a subsystem:
  - `src/modules/player/session/{service,repository,resolver,types}.ts`
  - `src/modules/updates/app-update/{service,store,runtime,index}.ts`
  - `src/modules/tracks/metadata/{utils,index}.ts`
- Preserve public import compatibility with temporary `index.ts` re-export barrels during migrations.
- Rename/move-only commits should be isolated from behavior refactors where possible.

## Reorganization Policy
- Files should live with owning domain, not with incidental caller.
- Route files under `src/app/**` should stay thin: params, data hooks, composition, navigation only.
- Heavy UI sections should move to `src/components/blocks/<domain>/` or `src/modules/<domain>/ui/`.
- Domain logic should live in `src/modules/<domain>/`, not `src/components/**` or `src/app/**`.
- Cross-domain adapters should live near boundary owner:
  - native/library adapters in `src/core/**` or `src/lib/**`
  - DB access in module repository folders
  - global state in `src/stores/**` only when truly app-wide
- Shared generic utilities stay in `src/utils/**`; domain-specific utilities move into their domain folder.
- When relocating files, update imports via barrels first, then remove compatibility exports in cleanup pass.
- Move/reorganize commits should not include behavior changes unless required to fix a compile/import error.

---

# Phase 10 [Completed] — Establish Verification Baseline

## Why
Full `tsc` is already red. Refactors are risky if current failures are not categorized. Existing errors include type mismatch in screens, toast adapter, Pressable handler typing, sheet prop typing, media-item animation props, and player native API wrapper.

## Files
- `package.json`
- `tsconfig.json`
- New optional script or docs file under `.rpiv/artifacts/verification/`

## Actions
1. Capture current `pnpm -s exec tsc --noEmit` output into a baseline artifact.
2. Group failures by owner:
   - third-party dependency type drift
   - UI component prop typing
   - player native API typing
   - route nullability
3. Add a documented targeted-check convention:
   - `pnpm -s exec tsc --noEmit | grep "path/to/file" || true`
4. Do not change source behavior.

## Success Criteria
- Baseline error inventory exists.
- Future phases can prove they do not add errors in touched files.

---

# Phase 11 [Completed] — Fix Route Nullability Before More UI Refactors

## Why
`src/app/(main)/(library)/album/[name].tsx` has known `albumInfo` possibly-null errors. This is both type debt and runtime-risk if album lookup fails mid-render.

## Files
- `src/app/(main)/(library)/album/[name].tsx`

## Actions
1. Identify data loading path for `albumInfo`.
2. Add guard/empty state before accessing `albumInfo` fields.
3. Keep existing UI for valid album data.
4. Avoid non-null assertions unless proven safe by code path.

## Success Criteria
- `album/[name].tsx` has no nullability TS errors.
- Invalid/missing album route renders fallback instead of crashing.

---

# Phase 12 [Completed] — Normalize Pressable Handler Typing

## Why
Multiple errors show event handler type mismatches:
- `src/components/blocks/mini-player.tsx`
- `src/components/blocks/sort-sheet.tsx`
Potential pattern: passing domain callbacks directly into Pressable-like `onPress`, where callbacks expect boolean/custom args or can be Reanimated shared values.

## Files
- `src/components/blocks/mini-player.tsx`
- `src/components/blocks/sort-sheet.tsx`
- Possibly shared button/pressable wrapper files under `src/components/ui/` or `src/components/blocks/`

## Actions
1. Wrap domain callbacks in no-arg closures where used as `onPress`.
2. Introduce small helper type if `PressableFeedback` exports awkward union types.
3. Remove `Parameters<...>` patterns that infer `SharedValue` union instead of function.

## Success Criteria
- Handler type errors vanish in touched files.
- Runtime press behavior unchanged.

---

# Phase 13 [Completed] — Fix Sheet Adapter Typing

## Why
Sheet/scroll prop types are drifting from library expectations:
- `src/components/blocks/playlist-form/track-picker-sheet-content.tsx`
- `src/components/blocks/indexing-progress.tsx`

## Files
- `src/components/blocks/playlist-form/track-picker-sheet-content.tsx`
- `src/components/blocks/indexing-progress.tsx`
- `src/modules/ui/toast` / `src/components/providers` if adapter defined there

## Actions
1. For `track-picker-sheet-content`, ensure `children` is explicit and required before spreading scroll props into bottom sheet component.
2. For indexing progress toast, adapt app toast manager to `ToastAdapter` through a local wrapper instead of passing library manager directly.
3. Keep toast UI and sheet behavior unchanged.

## Success Criteria
- Touched files clear TS errors.
- Indexing progress toast still displays persistent progress UI.
- Track picker sheet still scrolls and renders children.

---

# Phase 14 [Completed] — Value Navigation Sheet Type Model

## Why
`src/components/blocks/value-navigation-sheet.tsx` reads `image` and `subtitle` from values typed as `{ value: string }`. This is a type smell and likely why richer artist/genre picker data is awkward.

## Files
- `src/components/blocks/value-navigation-sheet.tsx`
- Call sites in:
  - `src/components/blocks/track-metadata-sheet.tsx`
  - any artist/genre/search navigation sheet callers

## Actions
1. Introduce `ValueNavigationItem` type:
   - `value: string`
   - `subtitle?: string`
   - `image?: string`
2. Allow prop to accept `Array<string | ValueNavigationItem>` or normalize callers to item objects.
3. Move normalization into helper to keep component render simple.

## Success Criteria
- Type errors in value navigation sheet fixed.
- Existing string-only callers still work.
- Rich item display remains supported.

---

# Phase 15 [Completed] — Media Item Animation Props Boundary

## Why
`src/components/ui/media-item.tsx` accepts props that may be `SharedValue<T>` but passes them directly into React Native `View` props requiring plain strings/accessibility roles/styles. This is a boundary leak between Reanimated props and normal RN props.

## Files
- `src/components/ui/media-item.tsx`
- callers passing shared values if any

## Actions
1. Split plain RN props from animated props.
2. Only pass `SharedValue` props to Animated components or resolve them through animated styles/props.
3. Narrow `BoundaryId` inputs to plain strings before passing to transition APIs.

## Success Criteria
- `media-item.tsx` type errors gone.
- Existing view transitions/animated behavior unchanged.

---

# Phase 16 [Completed] — Player Native API Type Boundary

## Why
`src/modules/player/utils.ts` has many native API type mismatches. This file likely acts as compatibility adapter for `react-native-audio-browser`; type drift here leaks across player code.

## Files
- `src/modules/player/utils.ts`
- `src/lib/react-native-audio-browser.ts`
- `src/modules/player/playback-core.ts`

## Actions
1. Centralize native API type adapters in one file.
2. Convert raw/native playback payloads to app-level snapshots before other modules consume them.
3. Fix specific errors:
   - ensure track title fallback exists before constructing native track
   - use correct `AppKilledPlaybackBehavior` enum/type
   - stop assuming `Playback.position`/`Playback.duration` exist unless adapted
   - normalize native event objects before logging as records
   - normalize `addListener` subscriptions into common unsubscribe shape
4. Do not modify playback behavior beyond type-safe conversions.

## Success Criteria
- `src/modules/player/utils.ts` targeted TS errors cleared.
- Playback setup/start/listener behavior unchanged manually.

---

# Phase 17 [Completed] — Finish Indexer Repository Decomposition

## Why
`src/modules/indexer/repository.ts` remains 1136 lines after count extraction. It still mixes scanning, batching, metadata preparation, relation rebuild, DB upsert, transient commit retry, deletion cleanup, and lookup cache handling.

## Files
- `src/modules/indexer/repository.ts`
- New files:
  - `src/modules/indexer/lookup-cache.repository.ts`
  - `src/modules/indexer/prepared-assets.ts`
  - `src/modules/indexer/track-upsert.repository.ts`
  - `src/modules/indexer/deleted-tracks.repository.ts`
  - `src/modules/indexer/relation-rebuild.repository.ts`

## Actions
1. Extract lookup cache creation:
   - `preloadIndexingLookupCache`
   - genre visual lookup helpers
2. Extract deleted-track handling:
   - `processDeletedTracksInScopes`
   - `hardDeleteSoftDeletedTracksInScopes`
3. Extract prepared-asset generation:
   - `prepareBatchAssets`
   - `prepareAssetForIndexing`
4. Extract track upsert:
   - `upsertPreparedAsset`
   - artist/album/genre get-or-create helpers if only used there
5. Extract split relation rebuild:
   - `rebuildSplitMetadataRelations`
   - `dedupeNormalizedValues`
6. Keep `scanMediaLibrary` as orchestration only.

## Success Criteria
- `repository.ts` drops under ~350 lines.
- All extracted files have clear names and no circular imports.
- Targeted checks for all indexer files pass.
- Full scan and rescan manually work.

---

# Phase 18 [Completed] — Metadata Parser Module Split

## Why
`src/modules/indexer/metadata.ts` remains 648 lines and mixes ID3 parsing, MP4 atom parsing, native metadata extraction, artwork cache, and cache cleanup.

## Files
- `src/modules/indexer/metadata.ts`
- New files:
  - `src/modules/indexer/metadata/id3-lyrics.ts`
  - `src/modules/indexer/metadata/mp4-lyrics.ts`
  - `src/modules/indexer/metadata/artwork-cache.repository.ts`
  - `src/modules/indexer/metadata/native-metadata.ts`

## Actions
1. Move ID3 lyric helpers into `id3-lyrics.ts`.
2. Move MP4 atom helpers into `mp4-lyrics.ts`.
3. Move artwork cache save/cleanup/hash into `artwork-cache.repository.ts`.
4. Keep public exports stable from `metadata.ts` as facade.
5. Add small unit-style pure tests if project supports test runner; otherwise document edge vectors.

## Success Criteria
- `metadata.ts` becomes facade/orchestrator.
- Parser helpers are independently readable.
- No behavior change in metadata/artwork extraction.

---

# Phase 19 [Completed] — Player Session Service Split

## Why
`src/modules/player/session.service.ts` is 814 lines and owns native reads, persisted session reads, queue ID resolution, active-index resolution, session application, and periodic persistence.

## Files
- `src/modules/player/session.service.ts`
- New files:
  - `src/modules/player/session-resolver.ts`
  - `src/modules/player/session-persistence.ts`
  - `src/modules/player/native-session.reader.ts`
  - `src/modules/player/session-apply.ts`

## Actions
1. Extract pure queue/session mapping:
   - native queue to tracks
   - persisted track map
   - track ID resolution
   - active index resolution
2. Extract native reads to `native-session.reader.ts`.
3. Extract storage reads/writes to `session-persistence.ts` or build on existing repository.
4. Keep `session.service.ts` as orchestration and public API facade.
5. Guard against stale async apply if session changes while restore runs.

## Success Criteria
- `session.service.ts` under ~300 lines.
- Public exports unchanged.
- Queue restore, active track, repeat/shuffle, resume still work.

---

# Phase 20 [Completed] — Player Action Sheet Decomposition

## Why
`src/components/blocks/player/action-sheet.tsx` is 773 lines. It likely mixes player state, sleep timer, queue/track actions, navigation, and UI sections.

## Files
- `src/components/blocks/player/action-sheet.tsx`
- New components/hooks under `src/components/blocks/player/action-sheet/`:
  - `PlayerActionHeader.tsx`
  - `PlayerActionMenu.tsx`
  - `SleepTimerSection.tsx`
  - `PlaybackSpeedSection.tsx`
  - `usePlayerActionSheetActions.ts`

## Actions
1. Extract presentational sections first.
2. Extract action handlers only if it makes dependencies clearer.
3. Keep sheet open/close behavior and user-facing strings unchanged.
4. Avoid generic menu abstraction unless reused by track action sheet.

## Success Criteria
- `action-sheet.tsx` becomes composition shell.
- No menu option disappears.
- Targeted check passes.

---

# Phase 21 [Completed] — Library Home Screen Decomposition

## Why
`src/app/(main)/(library)/index.tsx` is 753 lines. Large route screens are hard to change safely and tend to mix tabs, queries, sections, empty states, and actions.

## Files
- `src/app/(main)/(library)/index.tsx`
- New files under `src/components/blocks/library/` or `src/modules/library/ui/`:
  - `LibraryHeader.tsx`
  - `LibraryTabBar.tsx`
  - `LibrarySection.tsx`
  - `LibraryEmptyState.tsx`
  - `useLibraryHomeState.ts`

## Actions
1. Extract visual sections without changing query hooks.
2. Extract derived view state into hook.
3. Keep navigation and search actions in route until stable.

## Success Criteria
- route file under ~350 lines.
- Library tabs and carousels render unchanged.

---

# Phase 22 — Artist Detail Route Decomposition

## Why
`src/app/(main)/(library)/artist/[name].tsx` is 645 lines. Artist detail likely duplicates album detail and library detail patterns.

## Files
- `src/app/(main)/(library)/artist/[name].tsx`
- `src/app/(main)/(library)/album/[name].tsx`
- Shared detail components under `src/components/blocks/library-detail/`

## Actions
1. Extract shared hero/header detail component.
2. Extract shared track-section renderer.
3. Extract navigation transition ID handling if duplicated.
4. Fix any null/empty state issues discovered during extraction.

## Success Criteria
- artist route smaller and clearer.
- album route can reuse shared pieces in later phase.

---

# Phase 23 [Completed] — Lyrics Module Split

## Why
`src/modules/lyrics/index.ts` is 581 lines. It likely mixes source parsing, synced LRC parsing, timed markup parsing, timing heuristics, and exports.

## Files
- `src/modules/lyrics/index.ts`
- New files:
  - `src/modules/lyrics/lrc-parser.ts`
  - `src/modules/lyrics/timed-markup-parser.ts`
  - `src/modules/lyrics/timing.ts`
  - `src/modules/lyrics/plain-text.ts`

## Actions
1. Move pure parsers out of index barrel.
2. Keep public exports in `index.ts` for compatibility.
3. Add test vectors for:
   - plain lyrics
   - LRC lines
   - enhanced/timed markup
   - invalid timestamps

## Success Criteria
- `index.ts` becomes export facade.
- Parser behavior unchanged.

---

# Phase 24 [Completed] — Track Metadata Sheet Decomposition

## Why
`src/components/blocks/track-metadata-sheet.tsx` is already extracted but still 522 lines. It mixes derivation, navigation, layout pairing, nested sheets, and rendering.

## Files
- `src/components/blocks/track-metadata-sheet.tsx`
- New files:
  - `src/components/blocks/track-metadata/metadata-derivation.ts`
  - `src/components/blocks/track-metadata/MetadataGrid.tsx`
  - `src/components/blocks/track-metadata/useTrackMetadataNavigation.ts`

## Actions
1. Extract metadata item derivation to pure helper.
2. Extract grid layout/pairing to helper.
3. Extract metadata card grid component.
4. Keep navigation and sheet state local.

## Success Criteria
- metadata sheet under ~250 lines.
- Metadata values, quick facts, and navigation unchanged.

---

# Phase 25 [Completed] — Onboarding Wizard Decomposition

## Why
`src/app/onboarding/index.tsx` is 509 lines and likely mixes step state, theme selection, folder filters, permissions, and battery optimization.

## Files
- `src/app/onboarding/index.tsx`
- New files under `src/components/blocks/onboarding/`:
  - `OnboardingWelcome.tsx`
  - `ThemeStep.tsx`
  - `FolderFilterStep.tsx`
  - `PermissionsStep.tsx`
  - `useOnboardingPermissions.ts`

## Actions
1. Extract each step as presentational component.
2. Extract permission checking/requesting to hook.
3. Keep i18n keys only; no `defaultValue` or hardcoded strings.
4. Keep first-indexing gate unchanged.

## Success Criteria
- onboarding route under ~220 lines.
- Same first-open flow and settings restart behavior.

---

# Phase 26 [Completed] — Repository Naming Boundary Cleanup

## Why
Repo had both `src/data/*` and `src/modules/*/repository.ts`. This created unclear data-access ownership and duplicate query paths.

## Decision
- `src/modules/*/repository.ts` is now canonical for database access.
- `src/data/**` removed.
- Domain types used by former data APIs moved into module type files.

## Actions Taken
1. Moved album, artist, folder, playlist, genre, track, recent, and favorite DB functions into module repositories.
2. Moved shared data-layer types into `src/modules/library/data-types.ts`, `src/modules/tracks/types.ts`, and `src/modules/playlist/types.ts`.
3. Updated consumers to import from module repositories/types.
4. Deleted `src/data/**`.

## Success Criteria
- One obvious place for DB access.
- No duplicate artist/album/track query implementations.
- `src/data/**` removed.

---

# Phase 27 [Completed] — Kebab-Case Filename Convention Pass

## Why
Current source should use kebab-case filenames for consistency and AI-navigability. Dotted implementation filenames and PascalCase source files make modules feel fragmented.

## Current Targets
- `src/components/blocks/artist-picker-utils.ts`
- `src/components/blocks/onboarding/onboarding-welcome.tsx`
- `src/components/blocks/onboarding/use-onboarding-permissions.ts`
- `src/components/ui/animated-progress-bar-types.ts`
- `src/core/audio/track-player-service.ts`
- `src/core/storage/media-library-service.ts`
- `src/modules/history/cache-service.ts`
- `src/modules/indexer/counts-repository.ts`
- `src/modules/library/recent-searches-repository.ts`
- `src/modules/library/sort-constants.ts`
- `src/modules/library/sort-store.ts`
- `src/modules/library/sort-types.ts`
- `src/modules/library/sort-utils.ts`
- `src/modules/player/session-repository.ts`
- `src/modules/player/session-service.ts`
- `src/modules/playlist/form-draft-store.ts`
- `src/modules/playlist/use-form-editor.ts`
- `src/modules/playlist/use-picker-selection.ts`
- `src/modules/playlist/use-track-selection.ts`
- `src/modules/tracks/track-cleanup-repository.ts`
- `src/modules/tracks/track-device-deletion-service.ts`
- `src/modules/tracks/track-metadata-utils.ts`
- `src/modules/updates/app-update-runtime.ts`
- `src/modules/updates/app-update-service.ts`
- `src/modules/updates/app-update-store.ts`

## Exemptions
- `*.d.ts` declaration files.
- SQL migration filenames.
- JSON snapshot metadata files.
- Expo Router route files when dotted filenames have route semantics, e.g. `notification.click.tsx`, unless route can be safely represented as a folder without changing URL behavior.
- Files that must retain framework-required names like `_layout.tsx`, `+native-intent.tsx`, `[name].tsx`, and `[id].tsx`.

## Target Structures
- Library sort:
  - from `src/modules/library/sort-*.ts`
  - to `src/modules/library/sort/{constants,store,types,utils,index}.ts`
- Player session:
  - from `src/modules/player/session-service.ts` and `session-repository.ts`
  - to `src/modules/player/session/{service,repository,index}.ts`
- Playlist form/selection:
  - from `form-draft-store.ts`, `use-form-editor.ts`, `use-picker-selection.ts`, `use-track-selection.ts`
  - to `src/modules/playlist/form/{draft-store,use-editor}.ts` and `src/modules/playlist/selection/{use-picker-selection,use-track-selection}.ts`
- Tracks helpers:
  - from `track-cleanup-repository.ts`, `track-device-deletion-service.ts`, `track-metadata-utils.ts`
  - to `src/modules/tracks/cleanup/repository.ts`, `device-deletion/service.ts`, `metadata/utils.ts`
- Updates subsystem:
  - from `app-update-*.ts`
  - to `src/modules/updates/app-update/{runtime,service,store,index}.ts`
- Core adapters:
  - from `track-player-service.ts`, `media-library-service.ts`
  - to `src/core/audio/track-player/service.ts`, `src/core/storage/media-library/service.ts`

## Actions
1. Do pure move/rename commits first, no logic edits.
2. Add `index.ts` barrels where existing call sites need stable import paths.
3. Update imports with search/replace and run filename audit plus targeted checks.
4. Delete old files only after all imports move.
5. Keep compatibility re-exports for high-churn modules, then remove in a later cleanup pass.

## Success Criteria
- No dotted implementation filenames remain in `src/`, except allowed route/framework exceptions.
- No PascalCase source filenames remain in `src/`, except allowed route/framework exceptions.
- Imports still resolve.
- Behavior unchanged.
- Dotted declaration files remain untouched.

---

# Phase 28 — Store Error Handling / Silent Catch Cleanup

## Why
Silent `catch {}` appears in playback store files and lyrics view. Silent failures hide broken persistence and recovery paths.

## Files
- `src/stores/playback/actions/resynchronize.ts`
- `src/stores/playback/store.ts`
- `src/stores/playback/utils.ts`
- `src/components/blocks/player/lyrics-view.tsx`

## Actions
1. Replace silent catches with `logWarn` or scoped comments only when ignoring is intentional.
2. For storage hydration catches, log once not every render.
3. Keep UX unchanged; do not surface toasts unless needed.

## Success Criteria
- No unannotated `catch {}` in `src/stores/playback`.
- Debugging future restore issues becomes possible.

---

# Phase 29 — Query Key / Invalidation Consolidation

## Why
Query invalidation likely spans favorites, playlists, library, track metadata, indexing. Inconsistent invalidation causes stale UI after mutations.

## Files
- `src/lib/query-invalidation.ts`
- `src/modules/*/keys.ts`
- `src/modules/*/mutations.ts`
- `src/modules/playlist/mutations.ts`
- `src/modules/favorites/mutations.ts`

## Actions
1. Inventory all `queryClient.invalidateQueries` usages.
2. Create domain invalidation helpers:
   - `invalidateLibraryQueries`
   - `invalidatePlaylistQueries`
   - `invalidateTrackQueries`
3. Update mutations to call helpers.
4. Keep keys stable.

## Success Criteria
- Mutation invalidation logic is centralized.
- Playlist removal, favorites, and indexing refresh never leave stale detail screens.

---

# Phase 30 — Settings Screen Pattern Extraction

## Why
Settings screens repeat ListGroup/Card/section header patterns. Duplication makes UI drift likely.

## Files
- `src/app/settings/*.tsx`
- `src/components/blocks/settings/` new folder

## Actions
1. Extract `SettingsSection` wrapper.
2. Extract `SettingsActionRow` / `SettingsNavigationRow` if repeated.
3. Extract common safe-area scroll container.
4. Migrate screens one-by-one.

## Success Criteria
- Settings screens still visually match.
- Less repeated spacing/className boilerplate.

---

# Phase 31 — Runtime Bootstrap Flow Boundary
## Why
Bootstrap, onboarding gate, auto-scan, playback restore, notification setup, and app runtime are tightly coupled. First-open indexing was recently gated; this area needs clearer orchestration to prevent future regressions.

## Files
- `src/modules/runtime/app-runtime.tsx`
- `src/modules/bootstrap/runtime.ts`
- `src/modules/bootstrap/utils.ts`
- `src/app/_layout.tsx`
- `src/components/providers/root-providers.tsx`

## Actions
1. Document startup phases:
   - hydration
   - onboarding decision
   - database ready
   - playback restore
   - scan scheduling
2. Extract startup decision helper for onboarding/indexing gate.
3. Add a single function for “can start indexing now”.
4. Avoid scattered checks against `completedOnboarding`.

## Success Criteria
- Future onboarding changes cannot accidentally start indexing early.
- Startup flow readable from one file.

---

# Phase 32 — Misplaced File Reorganization Pass

## Why
Some files appear in technically valid but semantically weak locations. Over time this makes ownership unclear: app routes hold too much UI, components hold domain logic, modules hold UI-only concerns, and generic utils may contain domain-specific helpers.

## Initial Misplacement Targets
- Route-heavy screens:
  - `src/app/(main)/(library)/index.tsx`
  - `src/app/(main)/(library)/artist/[name].tsx`
  - `src/app/(main)/(library)/album/[name].tsx`
  - `src/app/(main)/(library)/playlist/[id].tsx`
  - `src/app/(main)/(search)/search.tsx`
  - `src/app/onboarding/index.tsx`
- Component files with domain logic:
  - `src/components/blocks/player/lyrics-view.tsx`
  - `src/components/blocks/player/action-sheet.tsx`
  - `src/components/blocks/track-metadata-sheet.tsx`
  - `src/components/blocks/artist-picker.utils.ts`
- Domain files that should be promoted into submodules:
  - `src/modules/library/recent-searches.repository.ts`
  - `src/modules/library/sort.*.ts`
  - `src/modules/player/session.*.ts`
  - `src/modules/playlist/*hook.ts`
  - `src/modules/updates/app-update.*.ts`
- Generic utility candidates to review for domain ownership:
  - `src/utils/transformers.ts`
  - `src/utils/file-path.ts`
  - `src/utils/format.ts`
  - `src/utils/common.ts`

## Target Structures
- Library route UI:
  - `src/modules/library/ui/home/*`
  - `src/modules/library/ui/artist-detail/*`
  - `src/modules/library/ui/album-detail/*`
- Search route UI/state:
  - `src/modules/search/ui/*`
  - `src/modules/search/hooks/*`
- Onboarding:
  - `src/modules/onboarding/ui/*`
  - `src/modules/onboarding/hooks/*`
  - `src/modules/onboarding/flow.ts`
- Player UI:
  - `src/modules/player/ui/action-sheet/*`
  - `src/modules/player/ui/lyrics/*`
- Track metadata UI:
  - `src/modules/tracks/ui/metadata-sheet/*`
- Domain utilities:
  - move from `src/utils/**` into `src/modules/<domain>/**` when utility references domain types or business rules.

## Actions
1. Inventory imports for each candidate before moving.
2. Choose owner folder by business meaning, not by current caller.
3. Move files in pure relocate commits.
4. Add `index.ts` barrels for stable imports.
5. Update route files so they become thin composition shells.
6. Remove compatibility barrels only after all callers migrate.

## Success Criteria
- Route files are shorter and mostly compose domain UI.
- Domain-specific helpers no longer live in generic `utils` or unrelated component folders.
- Import graph ownership is easier to follow.
- No behavior changes from moves.

---

# Priority Order

## Must do first
1. Phase 10 — Verification baseline
2. Phase 11 — Route nullability
3. Phase 12 — Pressable handler typing
4. Phase 13 — Sheet/toast adapter typing
5. Phase 14 — Value navigation sheet model
6. Phase 15 — Media item animation prop boundary
7. Phase 16 — Player native API type boundary

## High impact architecture
8. Phase 17 — Finish indexer repository decomposition
9. Phase 18 — Metadata parser module split
10. Phase 19 — Player session service split
11. Phase 31 — Runtime bootstrap flow boundary

## UI maintainability
12. Phase 20 — Player action sheet decomposition
13. Phase 21 — Library home screen decomposition
14. Phase 22 — Artist/detail route decomposition
15. Phase 24 — Track metadata sheet decomposition
16. Phase 25 — Onboarding wizard decomposition
17. Phase 30 — Settings screen pattern extraction

## Cleanup / consistency
18. Phase 27 [Completed] — Kebab-case filename convention pass
19. Phase 23 — Lyrics module split
20. Phase 26 [Completed] — Repository naming boundary cleanup
21. Phase 28 — Silent catch cleanup
22. Phase 32 — Misplaced file reorganization pass
23. Phase 29 — Query invalidation consolidation

## Notes
- Prior completed phases 1–9 remain valid and should not be redone unless review finds regression.
- This plan intentionally starts with type/error boundaries because current TS failures prevent confident full-codebase refactors.
