# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

ALWAYS use nub as package manager

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 3b. No Unnecessary Comments

**Don't add comments that merely restate what the code does. We will block changes that dump explanatory comments.**

- Do not add comments that explain obvious code (e.g. `// loop over artists` above a `for` loop, `// send request` above `fetch`).
- Do not narrate control flow or rephrase the function name.
- A comment is justified ONLY when it captures non-obvious *why*: a workaround for an external bug/quirk, a security constraint, a non-intuitive invariant, or a decision that future editors would otherwise reverse.
- Prefer renaming/refactoring to make intent self-evident over adding a comment.
- When fixing existing code, do not add comments to regions you are not changing.

The test: if a comment can be deleted without losing information a senior engineer wouldn't recover from the code, it should not exist.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. Tool Selection (MCP over CLI)

**Always prefer MCP tools over traditional shell commands (`ls`, `grep`, `rg`, `find`, `cat`) for exploring and understanding the codebase.**

The available `codedb_*` MCP tools are specifically designed to give structural context faster and with lower token overhead than raw shell outputs.

**Core Rules:**

- Do not use `grep` or `rg` for searching codebase content — use `codedb_search` or `codedb_word`.
- Do not use `find` or `ls` for locating files — use `codedb_find`, `codedb_ls`, `codedb_glob`, or `codedb_tree`.
- Do not use `grep` for finding usages or definitions — use `codedb_symbol`, `codedb_callers`, or `codedb_outline`.
- For initial orientation on a complex task, prefer `codedb_context`.
- For dependency tracing, use `codedb_deps` instead of manual searches.
- When calling `codedb_search`, pass the exact parameter object: `query` (required string), `max_results` (integer), `scope` (boolean), `compact` (boolean), `paths_only` (boolean), `regex` (boolean), `path_glob` (string), and optional `project` only when a valid `codedb.snapshot` project path is known. Do not invent parameters, omit `query`, or use malformed `project` values.
- If a `codedb_*` call fails from invalid parameters, correct the parameter object and retry once before using any other tool.
- For repeat bugs or repeated wrong fixes, stop and trace actual runtime flow first; do not stack assumptions on previous assumptions.
- For device-only issues, do not claim SQL/query verification unless validated through app logs, repository code, or reproducible device behavior.

**Available MCP Tools (`codedb`):**
| Tool | Description |
|------|-------------|
| `codedb_tree` | Full file tree with language, line counts, symbol counts |
| `codedb_outline` | Symbols in a file: functions, structs, imports, with line numbers |
| `codedb_symbol` | Find where a symbol is defined across the codebase |
| `codedb_search` | Trigram-accelerated full-text search (supports regex, scoped results) |
| `codedb_word` | O(1) inverted index word lookup |
| `codedb_callers` | Every call site of a symbol — word index ∩ outline scope, in one round-trip |
| `codedb_context` | Task-shaped composer — pass a NL task, get keywords + symbol defs + ranked files + top snippets in one block |
| `codedb_hot` | Most recently modified files |
| `codedb_deps` | Dependency graph: `imported_by` (default) or `depends_on`; `transitive=true` for full BFS |
| `codedb_read` | Read file content (line ranges, `compact` mode) |
| `codedb_changes` | Changed files since a sequence number |
| `codedb_status` | Index status (file count, current sequence, scan phase) |
| `codedb_projects` | List all locally indexed projects on this machine |
| `codedb_index` | Index a local folder and write `codedb.snapshot` |
| `codedb_find` | Fuzzy **file-name** search (typo-tolerant subsequence match against indexed paths) |
| `codedb_glob` | Match indexed paths against a glob pattern (`src/**/*.ts`, `*.md`, …) |
| `codedb_ls` | List immediate children of a directory — dirs first, then files with language + counts |
| `codedb_query` | Composable pipeline — chain `find`, `search`, `filter`, `deps`, `outline`, `read`, `sort`, `limit` in one request |

_Note: Editing (`codedb_edit`) is a fallback; continue using your primary native edit capability for code modifications. The above tools are strictly for reading, exploring, and building context._

## 6. Tooling & Build Notes

**Package manager:** Always use `nub` — it wraps pnpm (`.npmrc` `node-linker=hoisted`, `.pnpmfile.cjs`, `lock.yaml` is a pnpm lockfile, `lockfileVersion: 9.0`). Do not call `yarn`/`npm`/`pnpm` directly for installs; use `nub install` and `nub run <script>`.

**EAS pre-install** (`package.json` `eas-build-pre-install`): runs `npm install -g @nubjs/nub && corepack enable && corepack prepare yarn@4.13.0 --activate`. `@nubjs/nub` is installed globally because EAS cloud images don't ship it and build steps invoke `nub`. The `yarn@4.13.0` activation is intentionally kept as-is: there is no `yarn.lock` and yarn is not referenced anywhere else in the repo, but changing this script risks EAS cloud builds that cannot be exercised locally. GitHub Actions workflows install with `nub install --frozen-lockfile --node-linker hoisted`.

**Generated files (do not edit; ignored by lint/format):**

- `src/components/icons/` — generated by `@monicon` from `src/assets/icons` (`monicon.config.ts`). See `src/components/icons/README.md`.
- `src/uniwind-types.d.ts` — generated by uniwind.
- `src/assets/open-source-licenses.json` — generated by `nub run generate:licenses`.
- `lock.yaml` — pnpm-managed lockfile (pnpm owns its formatting).

**knip:** `nub run knip` reports a backlog of pre-existing unused files, exports, and dependencies (e.g. `ts-morph` is an unused `devDependency`, several `scripts/audit-*.mjs` files, and many exported domain types). These are known exceptions pending separate cleanup and are out of scope for config-only drift fixes; they do not reflect regressions.

**typecheck:** There is intentionally no `typecheck` script. `tsc --noEmit` has pre-existing errors (e.g. missing `react-native-audio-browser` type declarations, `ThemeColors.surface`). The project gates on `oxlint` (`.oxlintrc.json`, `import/no-cycle: error`), not on `tsc`.

**Checks:** `nub run lint` (oxlint), `nub run format:check` (oxfmt), `nub run test` (vitest), and `nub run check` (lint + test).

## 7. Component Architecture

Three component categories under `src/components/`:

### `ui/` — Primitives

Reusable, composable components with **minimal assumptions**. Each is a single-purpose building block.

**Rules:**

- No business logic, no queries, no mutations, no navigation.
- No assumptions about parent layout (flex, padding, positioning).
- Accept styling via `className` prop.
- Small surface area: 1–3 exports per file.
- Examples: `Button`, `EmptyState`, `Card`, `SectionHeader`, `ActionSheet.Root`, `MediaItem.Image`

### `blocks/` — Feature sections

Combine multiple `ui/` components (or other `blocks/`) into a **production-ready feature section or page fragment**. These are the concrete wires between UI and data.

**Rules:**

- May use queries, hooks, navigation, stores, mutations.
- Usually contains a complete interactive unit (a list with filters, a carousel with action sheet, a player).
- Always renders action sheets, dialogs, or other overlays **unconditionally** (mounted at all times, visibility controlled via prop).
- Examples: `AlbumsTab`, `ArtistGrid`, `MediaCarousel`, `TrackActionSheet`, `FavoritesList`, `RankedTrackCarousel`, `SearchResults`

### `patterns/` — UX/DX solutions

Demonstrate **how** `ui/` and `blocks/` components should be combined to solve a recurring UX or DX problem. Not full page sections, not primitive atoms — they codify a design decision.

**Rules:**

- Always use `ui/` primitives internally. Never use `patterns/` inside `blocks/` (inverted dependency).
- A pattern codifies a specific layout, interaction, or composition decision.
- Examples: `TrackRow` (how tracks are laid out with MediaItem), `MusicCard` (how album/playlist cards look), `BackButton` (how back navigation works app-wide), `PlaylistArtwork` (how playlist art grid renders), `SearchResultRow` (how search results render per type)

### Dependency direction

```
ui/ ← patterns/ ← blocks/ ← screens/routes
```

`ui/` knows nothing about `patterns/` or `blocks/`. `patterns/` imports only from `ui/` and external libs. `blocks/` imports from `ui/`, `patterns/`, and domain modules.
