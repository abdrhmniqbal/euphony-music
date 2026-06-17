/**
 * Purpose: Persists and evaluates minimum duration filtering for indexed audio tracks.
 * Caller: Track duration settings screen, library settings summary, media indexer.
 * Dependencies: i18next localization, settings repository, settings store, settings types.
 * Main Functions: ensureTrackDurationFilterConfigLoaded(), setTrackDurationFilterConfig(), getTrackDurationMinimumSeconds(), isAssetAllowedByTrackDuration(), getTrackDurationFilterLabel().
 * Side Effects: Reads/writes track-duration-filter.json and mutates in-memory settings state.
 */

import { i18n } from "@/modules/localization/i18n"
import type { TrackDurationFilterConfig, TrackDurationFilterMode } from "@/modules/settings/types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultTrackDurationFilterConfig,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"

export type { TrackDurationFilterConfig, TrackDurationFilterMode }

const TRACK_DURATION_FILTER_FILE = createSettingsConfigFile("track-duration-filter.json")

let loadPromise: Promise<TrackDurationFilterConfig> | null = null
let hasLoadedConfig = false

function clampCustomSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return getDefaultTrackDurationFilterConfig().customMinimumSeconds
  }

  return Math.max(0, Math.min(1200, Math.round(value)))
}

function sanitizeConfig(config: unknown): TrackDurationFilterConfig {
  const source = config && typeof config === "object" ? (config as Record<string, unknown>) : {}

  const mode: TrackDurationFilterMode =
    source.mode === "min30s" ||
    source.mode === "min60s" ||
    source.mode === "min120s" ||
    source.mode === "custom"
      ? source.mode
      : "off"

  return {
    mode,
    customMinimumSeconds: clampCustomSeconds(
      (typeof source.customMinimumSeconds === "number" ? source.customMinimumSeconds : undefined) ??
        getDefaultTrackDurationFilterConfig().customMinimumSeconds
    ),
  }
}

async function persistConfig(config: TrackDurationFilterConfig): Promise<void> {
  await saveSettingsConfig(TRACK_DURATION_FILTER_FILE, config)
}

export async function ensureTrackDurationFilterConfigLoaded(): Promise<TrackDurationFilterConfig> {
  if (hasLoadedConfig) {
    return getSettingsState().trackDurationFilterConfig
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const next = await loadSettingsConfig(
      TRACK_DURATION_FILTER_FILE,
      getDefaultTrackDurationFilterConfig(),
      sanitizeConfig
    )
    updateSettingsState({ trackDurationFilterConfig: next })
    hasLoadedConfig = true
    return next
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setTrackDurationFilterConfig(
  updates: Partial<TrackDurationFilterConfig>
): Promise<TrackDurationFilterConfig> {
  await ensureTrackDurationFilterConfigLoaded()
  const current = getSettingsState().trackDurationFilterConfig
  const next = sanitizeConfig({ ...current, ...updates })
  updateSettingsState({ trackDurationFilterConfig: next })
  hasLoadedConfig = true
  await persistConfig(next)
  return next
}

export function getTrackDurationMinimumSeconds(config: TrackDurationFilterConfig): number {
  if (config.mode === "min30s") {
    return 30
  }

  if (config.mode === "min60s") {
    return 60
  }

  if (config.mode === "min120s") {
    return 120
  }

  if (config.mode === "custom") {
    return clampCustomSeconds(config.customMinimumSeconds)
  }

  return 0
}

export function isAssetAllowedByTrackDuration(
  durationSeconds: number,
  config: TrackDurationFilterConfig
): boolean {
  const minDuration = getTrackDurationMinimumSeconds(config)
  if (minDuration <= 0) {
    return true
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return false
  }

  return durationSeconds >= minDuration
}

export function getTrackDurationFilterLabel(config: TrackDurationFilterConfig): string {
  if (config.mode === "min30s") {
    return i18n.t("settings.trackDuration.label.min30")
  }

  if (config.mode === "min60s") {
    return i18n.t("settings.trackDuration.label.min60")
  }

  if (config.mode === "min120s") {
    return i18n.t("settings.trackDuration.label.min120")
  }

  if (config.mode === "custom") {
    const seconds = getTrackDurationMinimumSeconds(config)
    if (seconds < 60) {
      return i18n.t("settings.trackDuration.label.customSeconds", {
        seconds,
      })
    }
    const minutes = Math.floor(seconds / 60)
    const rem = seconds % 60
    return rem > 0
      ? i18n.t("settings.trackDuration.label.customMinutesSeconds", {
          minutes,
          seconds: rem,
        })
      : i18n.t("settings.trackDuration.label.customMinutes", {
          minutes,
        })
  }

  return i18n.t("settings.trackDuration.label.off")
}
