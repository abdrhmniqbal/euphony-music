<img src="./.github/assets/logo.png" alt="Startune logo" title="Startune logo" width="80"/>

# Startune Music

Offline-first local music player built with Expo + React Native.

[![Release](https://img.shields.io/github/v/release/abdrhmniqbal/startune-music?label=latest)](https://github.com/abdrhmniqbal/startune-music/releases/latest)
[![Pre-release](https://img.shields.io/github/v/release/abdrhmniqbal/startune-music?include_prereleases&label=pre-release)](https://github.com/abdrhmniqbal/startune-music/releases)
[![License](https://img.shields.io/github/license/abdrhmniqbal/startune-music)](LICENSE)

## Overview

Startune Music plays audio files already on your device. No streaming, no accounts, no remote libraries.

## Features

- Offline-first local playback with queue, repeat, shuffle, crossfade, seeking, and background audio
- Library browsing for tracks, albums, artists, genres, playlists, favorites, and folders
- Smart mixes (Daily Mix and For You Mix) built from listening history
- Synchronized lyrics (TTML, `.lrc`, embedded) with LRCLib auto-fetch fallback
- Last.fm integration for scrobbling, artist bios, and artwork scraping
- Playlist creation, editing, reordering, and playlist-aware track actions
- Rich player surfaces: mini player, full player, queue view, and metadata sheet
- Indexing with progress notifications, auto-scan, scoped folder filtering, and track-duration filters
- 15 built-in color themes (Nord, Dracula, Catppuccin, Tokyo, Gruvbox, Everforest, Rose Pine, Solarized, Ayu, Monochrome, and more)
- Backup and restore settings and preferences
- Search with recent searches, recently added tracks, and direct navigation into media detail screens
- Reorderable library tabs with visibility toggles

## Changelog

Release history is tracked in [CHANGELOG.md](./CHANGELOG.md).

## Installation

### APK (recommended)

Download the latest APK from:

- Stable: https://github.com/abdrhmniqbal/startune-music/releases/latest
- All releases: https://github.com/abdrhmniqbal/startune-music/releases

## Development

### Requirements

- `pnpm` package manager
- Node.js
- Expo / Android Studio for local Android builds

### Local setup

```bash
pnpm install
pnpm run start
```

Useful commands:

```bash
pnpm run android    # Build and run on Android
pnpm run lint       # Lint using oxlint
pnpm run format     # Format files using oxfmt
pnpm run format:check # Validate file formatting
pnpm run test       # Run unit tests via vitest
pnpm run check      # Run lint + tests
```

## Tech Stack

- Expo SDK 56
- React Native 0.85
- Expo Router
- Zustand
- TanStack Query
- Drizzle ORM + Expo SQLite
- HeroUI Native
- Legend List
- React Native Audio Browser

## Contributing

Issues and pull requests are welcome.

Before opening a PR:

1. Keep changes scoped.
2. Ensure lint/type checks pass locally.
3. Include clear reproduction/verification steps for fixes.

## Notes

- This project is in active development.
- The app is designed for offline/local-library usage rather than cloud streaming.
