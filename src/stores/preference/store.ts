/**
 * Purpose: Stores app preferences using the reference preference-store shape.
 * Caller: Preference actions, settings adapters, playback setup.
 * Dependencies: Zustand, Uniwind, Startune localization.
 * Main Functions: preferenceStore, usePreferenceStore.
 * Side Effects: Applies theme and language during initialization.
 */

import { I18nManager } from "react-native"
import { create } from "zustand"
import { Uniwind } from "uniwind"

import { i18n } from "@/modules/localization/i18n"
import type { PreferenceStore } from "./constants"
import { resolveLanguageConfigs } from "./utils"

export const preferenceStore = create<PreferenceStore>((set) => ({
  _hasHydrated: false,
  _init: async (state) => {
    Uniwind.setTheme(state.theme)
    await resolveLanguageConfigs(
      state.language ||
        I18nManager.getConstants().localeIdentifier?.replace("_", "-") ||
        "en",
      state.forceLTR
    )
    set({
      _hasHydrated: true,
      language: state.language || i18n.resolvedLanguage || "en",
    })
  },
  completedOnboarding: false,
  language: "",
  forceLTR: false,
  accentFont: "NType",
  primaryFont: "Roboto",
  theme: "system",
  activeCustomThemeId: null,
  activeCustomTheme: null,
  showNavbar: true,
  homeTab: "home",
  tabsOrder: ["home", "folder", "playlist", "track", "album", "artist", "genre"],
  tabsVisibility: {
    album: true,
    artist: true,
    folder: true,
    genre: true,
    home: true,
    playlist: true,
    track: true,
  },
  minAlbumLength: 0,
  miniplayerGestures: false,
  dragClearPlayback: false,
  nowPlayingDesign: "vinyl",
  quickScroll: true,
  squareArtwork: true,
  playbackDelay: 0,
  continuePlaybackOnDismiss: true,
  repeatOnSkip: false,
  restoreLastPosition: true,
  quickAddQueue: false,
  quickFavorite: false,
  rescanOnLaunch: true,
  optimizedImageSave: true,
  listAllow: [],
  listBlock: [],
  minSeconds: 15,
  separators: [],
  checkForUpdates: false,
  rcNotification: false,
  downsamplingProcessor: true,
  queueAwareNext: false,
  waveformSlider: false,
}))

void preferenceStore.getState()._init(preferenceStore.getState())

export function usePreferenceStore<T>(selector: (state: PreferenceStore) => T): T {
  return preferenceStore(selector)
}
