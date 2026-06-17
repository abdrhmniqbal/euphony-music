/**
 * Purpose: Loads, sanitizes, and persists audio playback behavior settings.
 * Caller: Audio settings screen, bootstrap settings preload, and player interruption/lifecycle services.
 * Dependencies: Settings repository and settings store.
 * Main Functions: ensureAudioPlaybackConfigLoaded(), setAudioPlaybackConfig()
 * Side Effects: Reads and writes `audio-playback.json` in Expo document storage and mutates settings state.
 */

import type { AudioPlaybackConfig } from "@/modules/settings/types"
import {
  createSettingsConfigFile,
  loadSettingsConfig,
  saveSettingsConfig,
} from "@/modules/settings/repository"
import {
  getDefaultAudioPlaybackConfig,
  getSettingsState,
  updateSettingsState,
} from "@/modules/settings/store"

export type { AudioPlaybackConfig }

const AUDIO_PLAYBACK_FILE = createSettingsConfigFile("audio-playback.json")

let loadPromise: Promise<AudioPlaybackConfig> | null = null
let hasLoadedConfig = false

function sanitizeBoolean(
  source: Record<string, unknown>,
  key: keyof AudioPlaybackConfig
) {
  const value = source[key]
  return typeof value === "boolean" ? value : getDefaultAudioPlaybackConfig()[key]
}

function sanitizeConfig(config: unknown): AudioPlaybackConfig {
  const source =
    config && typeof config === "object"
      ? (config as Record<string, unknown>)
      : {}

  return {
    fadePlayPauseStop: sanitizeBoolean(source, "fadePlayPauseStop"),
    fadeOnSeek: sanitizeBoolean(source, "fadeOnSeek"),
    resumeAfterCall: sanitizeBoolean(source, "resumeAfterCall"),
    resumeOnStart: sanitizeBoolean(source, "resumeOnStart"),
    resumeOnReopen: sanitizeBoolean(source, "resumeOnReopen"),
    shortAudioFocusChange: sanitizeBoolean(source, "shortAudioFocusChange"),
    pauseInCall: sanitizeBoolean(source, "pauseInCall"),
    resumeOnFocusGain: sanitizeBoolean(source, "resumeOnFocusGain"),
    duckVolume: sanitizeBoolean(source, "duckVolume"),
    permanentAudioFocusChange: sanitizeBoolean(
      source,
      "permanentAudioFocusChange"
    ),
  }
}

async function persistConfig(config: AudioPlaybackConfig): Promise<void> {
  await saveSettingsConfig(AUDIO_PLAYBACK_FILE, config)
}

export async function ensureAudioPlaybackConfigLoaded(): Promise<AudioPlaybackConfig> {
  if (hasLoadedConfig) {
    return getSettingsState().audioPlaybackConfig
  }

  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const next = await loadSettingsConfig(
      AUDIO_PLAYBACK_FILE,
      getDefaultAudioPlaybackConfig(),
      sanitizeConfig
    )
    updateSettingsState({ audioPlaybackConfig: next })
    hasLoadedConfig = true
    return next
  })()

  const result = await loadPromise
  loadPromise = null
  return result
}

export async function setAudioPlaybackConfig(
  updates: Partial<AudioPlaybackConfig>
): Promise<AudioPlaybackConfig> {
  await ensureAudioPlaybackConfigLoaded()
  const current = getSettingsState().audioPlaybackConfig
  const next = sanitizeConfig({ ...current, ...updates })
  updateSettingsState({ audioPlaybackConfig: next })
  hasLoadedConfig = true
  await persistConfig(next)
  return next
}
