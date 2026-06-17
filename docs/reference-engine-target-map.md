# Reference Engine Target Map

Generated during Plan 003 execution. Baseline commit `b46d5b9`.

## 1. Reference-to-Startune mapping

| Reference path                                 | Startune target                                                    | Status                                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `.tmp/Music/mobile/src/stores/Playback/`       | `src/stores/playback/`                                             | In progress — playback store exists but imports old player types                                                   |
| `.tmp/Music/mobile/src/stores/Preference/`     | `src/stores/preference/`                                           | Done                                                                                                               |
| `.tmp/Music/mobile/src/stores/Session/`        | `src/stores/session/`                                              | Done                                                                                                               |
| `.tmp/Music/mobile/src/stores/ViewPreference/` | `src/stores/view-preference/`                                      | Done                                                                                                               |
| `.tmp/Music/mobile/src/data/`                  | `src/data/`                                                        | Done — data layer migrated; field names diverge (`name` vs `title`)                                                |
| `.tmp/Music/mobile/src/modules/scanning/`      | `src/modules/scanning/`                                            | Partial — scanning hooks/helpers ported, UI components live in `src/app`                                           |
| `.tmp/Music/mobile/src/modules/media/`         | `src/modules/media/`                                               | Partial — only `constants.ts` ported; UI components live in `src/components`                                       |
| `.tmp/Music/mobile/src/modules/search/`        | `src/modules/search/`                                              | Partial — data layer ported (repository/queries/keys); UI screens/components not yet ported                        |
| `.tmp/Music/mobile/src/modules/lyric/`         | `src/modules/lyrics/`                                              | Partial — source/index/auto-scroll-runtime ported; full module not yet ported                                      |
| `.tmp/Music/mobile/src/initServices.ts`        | `src/stores/playback/actions/playback-controls.ts` (setupPlayback) | Partial — AudioBrowser setup and remote handlers live in playback-controls; init-services pattern not fully ported |
| `.tmp/Music/mobile/src/modules/audio/`         | N/A (out of scope for plan 003)                                    | Not started — replayGain/equalizer modules not ported; stubs needed if playback references them                    |
| `.tmp/Music/mobile/src/modules/widget/`        | N/A (out of scope)                                                 | Not started — widget utils stubs needed                                                                            |

## 2. Old module disposition — `src/modules/player/`

| File                    | Disposition                    | Rationale                                                                                                                    |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `activity.ts`           | keep (facade)                  | Play-count tracking; already delegates to history module. Becomes playback facade subscriber.                                |
| `adapter.ts`            | keep (facade)                  | Maps between playback types and AudioBrowser/old player types. Becomes thin adapter.                                         |
| `colors-store.ts`       | move → `colors/store.ts`       | UI-only color extraction state. Rename per naming convention.                                                                |
| `colors.ts`             | move → `colors/service.ts`     | UI-only color extraction logic. Rename per naming convention.                                                                |
| `controls.ts`           | keep (facade)                  | High-level playback commands (pause/resume/seek/next/prev). Delegates to `src/stores/playback/actions`. No native API calls. |
| `crossfade.ts`          | keep (facade)                  | Volume fade logic. Uses `./utils` TrackPlayer wrapper. Out of scope for plan 003 but stays as UI facade helper.              |
| `favorites.ts`          | keep (facade)                  | Favorite toggle helper. Uses player store.                                                                                   |
| `intent-runtime.ts`     | keep (facade)                  | Handles external URI intents. Uses bootstrap + service.                                                                      |
| `library.ts`            | keep (facade)                  | Loads tracks into player store.                                                                                              |
| `playback-core.ts`      | keep (facade)                  | Transitional facade — delegates to `src/stores/playback/actions`. Can be inlined into controls.ts later.                     |
| `queue.ts`              | keep (facade)                  | Queue management facade — delegates to `src/stores/playback/actions/queue`. Does NOT call native APIs.                       |
| `repository.ts`         | keep                           | Track query helpers for player module.                                                                                       |
| `runtime-state.ts`      | keep (facade)                  | Updates old player store from playback events. Becomes playback subscriber.                                                  |
| `runtime.ts`            | keep (facade)                  | Queue replacement depth tracking. Small utility.                                                                             |
| `selectors.ts`          | keep (facade)                  | React selectors reading from old player store.                                                                               |
| `service.ts`            | keep (facade)                  | High-level play entry point. Delegates to playback-actions.                                                                  |
| `session-comparison.ts` | keep (facade)                  | Session snapshot diffing utilities.                                                                                          |
| `session.repository.ts` | move → `session/repository.ts` | Playback session persistence. Rename per naming convention.                                                                  |
| `session.service.ts`    | move → `session/service.ts`    | Playback session restore/sync. Rename per naming convention.                                                                 |
| `sleep-timer.ts`        | keep (facade)                  | Sleep timer logic. Uses player store.                                                                                        |
| `store.ts`              | keep (facade)                  | Old player Zustand store. Mirrors playback store state for UI.                                                               |
| `transition.ts`         | keep (facade)                  | Player transition ID utility.                                                                                                |
| `types.ts`              | keep (facade)                  | Shared UI domain types. Playback store defines own local types instead.                                                      |
| `utils.ts`              | keep (facade)                  | Old TrackPlayer wrapper utilities. Used by crossfade/session modules.                                                        |

## 3. Old module disposition — `src/modules/indexer/`

| File                        | Disposition           | Rationale                                                       |
| --------------------------- | --------------------- | --------------------------------------------------------------- |
| `batch-utils.ts`            | replace with scanning | Reference scanning module handles batching differently.         |
| `file-identity.ts`          | replace with scanning | Reference scanning handles file identity.                       |
| `metadata.ts`               | keep                  | Metadata extraction; used by player service for external files. |
| `normalization.ts`          | replace with scanning | Reference scanning handles normalization.                       |
| `notification.ts`           | replace with scanning | Reference scanning handles notifications.                       |
| `progress-toast-runtime.ts` | replace with scanning | Reference scanning handles progress display.                    |
| `progress.ts`               | replace with scanning | Reference scanning handles progress tracking.                   |
| `refresh.ts`                | replace with scanning | Reference scanning handles refresh.                             |
| `repository.ts`             | replace with scanning | Reference scanning replaces indexer repository.                 |
| `run-snapshot.ts`           | replace with scanning | Reference scanning handles run snapshots.                       |
| `runtime.ts`                | replace with scanning | Reference scanning replaces indexer runtime.                    |
| `scan-filter.ts`            | replace with scanning | Reference scanning handles filter logic.                        |
| `service.ts`                | replace with scanning | Reference scanning replaces indexer service.                    |
| `store.ts`                  | replace with scanning | Reference scanning replaces indexer store.                      |
| `types.ts`                  | replace with scanning | Reference scanning defines own types.                           |

## 4. UI adapter map

| Current UI component/screen                            | Stable adapter to use                                      | Reference store/action behind it                                        |
| ------------------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/components/blocks/player/playback-controls.tsx`   | `@/modules/player/controls`                                | `playback-controls.ts` → `PlaybackControls.play/pause/next/prev/seekTo` |
| `src/components/blocks/player/queue-view.tsx`          | `@/modules/player/queue`                                   | `queue.ts` → `Queue.add/addToEnd/moveTrack/removeIds`                   |
| `src/components/blocks/player/full-player-content.tsx` | `@/modules/player/colors-store`                            | `colors-store.ts` → `usePlayerColorsStore`                              |
| `src/components/blocks/player/selectors`               | `@/modules/player/selectors`                               | `selectors.ts` → reads from `usePlayerStore` (mirrors playback)         |
| `src/components/blocks/player/action-sheet.tsx`        | `@/modules/player/selectors` + `@/modules/player/queue`    | `selectors.ts` + `queue.ts`                                             |
| `src/app/(main)/**/*.tsx` screens                      | `@/modules/player/service` + `@/modules/player/selectors`  | `service.ts` → `playTrack()` / `selectors.ts`                           |
| `src/components/blocks/mini-player.tsx`                | `@/modules/player/controls` + `@/modules/player/selectors` | `controls.ts` + `selectors.ts`                                          |
| `src/components/blocks/track-list.tsx`                 | `@/modules/player/service` + `@/modules/player/store`      | `service.ts` → `playTrack()` / `store.ts` → `usePlayerStore`            |
