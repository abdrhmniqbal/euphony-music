# Build Guide

This project supports:

1. Local Android builds (debug and release APK)
2. GitHub Actions release APK builds (draft GitHub Release)

This guide does not cover Play Store publishing.

## Prerequisites

1. Node.js `20.x`
2. Bun `1.2.x`
3. JDK `17`
4. Android SDK configured (`ANDROID_HOME` / `ANDROID_SDK_ROOT`)
5. Android device or emulator (for debug install)

## Local Build

### 1. Install dependencies

```bash
bun install --frozen-lockfile
```

### 2. Run debug build on device/emulator

```bash
bun run android
```

### 3. Build release APK (local)

```bash
cd android
chmod +x gradlew
./gradlew assembleRelease
```

Output APK path:

```text
android/app/build/outputs/apk/release/
```

## Signing for Release APK

Release signing is configured through:

1. `android/gradle.properties` signing entries
2. `android/app/keystore.jks`

In CI, these are provided via GitHub Secrets:

1. `RELEASE_CRED`: multiline gradle properties for signing
2. `KEYSTORE_BASE64`: base64 of the release keystore file

Expected properties inside `RELEASE_CRED`:

```properties
RELEASE_KEYSTORE_PASSWORD=your_store_password
RELEASE_KEY_ALIAS=your_key_alias
RELEASE_KEY_PASSWORD=your_key_password
```

## GitHub Workflow (APK Release)

Workflow file:

```text
.github/workflows/release-apk.yml
```

What it does:

1. Triggers on tag push: `v*.*.*` and `v*.*.*-rc.*`
2. Supports manual dispatch with `tag` input
3. Resolves version from tag
4. Updates `package.json` (version) and `android/app/build.gradle` (versionCode + versionName)
5. Builds universal APK + ABI-specific APKs (`armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64`)
6. Uploads all APKs as workflow artifact
7. Creates draft GitHub Release with all APKs attached

## Tag-Based Versioning

Accepted formats:

1. Stable: `vMAJOR.MINOR.PATCH` (example `v1.2.3`)
2. RC: `vMAJOR.MINOR.PATCH-rc.N` (example `v1.2.3-rc.1`)

Mapping:

1. `versionName` = tag without leading `v`
2. `expo.version` in `app.json` = `versionName`
3. `versionCode` formula:

```text
base = major*1000000 + minor*10000 + patch*100
suffix = 99 for stable, or rc number (max 98) for rc
versionCode = base + suffix
```

Examples:

1. `v1.2.3-rc.1` -> `versionName=1.2.3-rc.1`, `versionCode=1020301`
2. `v1.2.3` -> `versionName=1.2.3`, `versionCode=1020399`

## Create a Release Build from Tag

```bash
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

Or run the workflow manually from GitHub Actions and pass a `tag` value.

## Troubleshooting

### APK is unsigned

Check:

1. `RELEASE_CRED` secret content is valid
2. `KEYSTORE_BASE64` decodes to a correct `.jks`

### Tag rejected by workflow

Check tag format:

1. `v1.2.3`
2. `v1.2.3-rc.1`

### Version not updated

Check workflow logs for step:

1. `Derive app version from tag`
2. `Apply version to app config`
