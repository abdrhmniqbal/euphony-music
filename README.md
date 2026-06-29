<img src="./.github/assets/logo.png" alt="Startune logo" title="Startune logo" width="80"/>

# Startune Music

Offline-first local music player built with Expo + React Native.

[![Release](https://img.shields.io/github/v/release/abdrhmniqbal/startune-music?label=latest)](https://github.com/abdrhmniqbal/startune-music/releases/latest)
[![Pre-release](https://img.shields.io/github/v/release/abdrhmniqbal/startune-music?include_prereleases&label=pre-release)](https://github.com/abdrhmniqbal/startune-music/releases)
[![Downloads](https://img.shields.io/github/downloads/abdrhmniqbal/startune-music/total)](https://github.com/abdrhmniqbal/startune-music/releases)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2056-000020?logo=expo)](https://docs.expo.dev)

## Overview

Startune Music is a local-library music player focused on offline playback, fast browsing, and modern mobile UX. It indexes audio already stored on the device, keeps the experience responsive during rescans, and supports rich playback flows without depending on a remote account or streaming backend.

## Features

- Offline-first local playback with queue, repeat, shuffle, crossfade, seeking, and background audio
- Library browsing for tracks, albums, artists, genres, playlists, favorites, and folders
- Smart mixes (Daily Mix and For You Mix) built from listening history
- Synchronized lyrics (TTML, `.lrc`, embedded) with LRCLib auto-fetch fallback
- Last.fm integration for scrobbling, artist bios, and artwork scraping
- Playlist creation, editing, reordering, and playlist-aware track actions
- Rich player surfaces: mini player, full player, queue view, and metadata sheet
- Indexing with progress notifications, auto-scan, scoped folder filtering, and track-duration filters
- Multiple color themes (Catppuccin, Dracula, Nord, Alucard) and extensive customization
- Backup and restore settings and preferences
- Search with recent searches, recently added tracks, and direct navigation into media detail screens

## Changelog

Release history is tracked in [CHANGELOG.md](./CHANGELOG.md).

## Installation

### APK (recommended)

Download the latest APK from:

- Stable: https://github.com/abdrhmniqbal/startune-music/releases/latest
- All releases: https://github.com/abdrhmniqbal/startune-music/releases

## Development

### Requirements

- `nub` package manager
- Node.js
- Expo / Android Studio for local Android builds

### Local setup

```bash
nub install
nub run start
```

Useful commands:

```bash
nub run android      # Build and run on Android
nub run lint         # Lint using oxlint
nub run format       # Format files using oxfmt
nub run format:check # Validate file formatting
nub run test         # Run unit tests via vitest
nub run check        # Run lint + tests
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
