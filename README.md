<img src="./.github/assets/logo.png" alt="Startune logo" title="Startune logo" width="80"/>

# Startune Music

Offline-first local music player built with Expo + React Native.

[![Release](https://img.shields.io/github/v/release/abdrhmniqbal/startune-music?label=stable)](https://github.com/abdrhmniqbal/startune-music/releases/latest)
[![Pre-release](https://img.shields.io/github/v/release/abdrhmniqbal/startune-music?include_prereleases&label=pre-release)](https://github.com/abdrhmniqbal/startune-music/releases)
[![Downloads](https://img.shields.io/github/downloads/abdrhmniqbal/startune-music/total)](https://github.com/abdrhmniqbal/startune-music/releases)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2056-000020?logo=expo)](https://docs.expo.dev)

## Overview

Startune Music is a local-library music player focused on offline playback, fast browsing, and modern mobile UX. It indexes audio already stored on the device, keeps the experience responsive during rescans, and supports rich playback flows without depending on a remote account or streaming backend.

## Features

- Offline-first local playback with queue, repeat, shuffle, seeking, and background audio
- Library browsing for tracks, albums, artists, genres, playlists, favorites, and folders
- Genre detail flows with top tracks and recommended albums
- Playlist creation, editing, reordering, and playlist-aware track actions
- Rich player surfaces: mini player, full player, queue view, lyrics, and metadata sheet
- Indexing with progress notifications, auto-scan, force reindex, and scoped filtering
- Folder whitelist/blacklist filtering and track-duration filters
- Theme and settings controls for playback behavior, indexing behavior, notifications, and logging
- Search with recent searches, recently added tracks, and direct navigation into media detail screens

## Screenshots

Screenshots and release assets are published on the GitHub releases page:

- Latest release: https://github.com/abdrhmniqbal/startune-music/releases/latest
- Full release history: https://github.com/abdrhmniqbal/startune-music/releases

## Changelog

Release history is tracked in [CHANGELOG.md](./CHANGELOG.md).

## Installation

### APK (recommended)

Download the latest APK from:

- Stable: https://github.com/abdrhmniqbal/startune-music/releases/latest
- All releases: https://github.com/abdrhmniqbal/startune-music/releases

## Development

### Requirements

- Bun
- Node.js
- Expo / Android Studio for local Android builds

### Local setup

```bash
bun install
bun run start
```

Useful commands:

```bash
bun run android
bun run lint
bun run format
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
- React Native Track Player

## Contributing

Issues and pull requests are welcome.

Before opening a PR:

1. Keep changes scoped.
2. Ensure lint/type checks pass locally.
3. Include clear reproduction/verification steps for fixes.

## Notes

- This project is in active development.
- The app is designed for offline/local-library usage rather than cloud streaming.
