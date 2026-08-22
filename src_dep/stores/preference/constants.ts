/**
 * Purpose: Defines preference store contract copied from the reference store shape.
 * Caller: Preference store and preference actions.
 * Dependencies: preference types.
 * Main Functions: PreferenceStore, NowPlayingDesignOptions, OmittedFields.
 * Side Effects: None.
 */

import type { Tab } from "./types"

export const NowPlayingDesignOptions = ["plain", "vinyl", "vinylOld"] as const

export type NowPlayingDesign = (typeof NowPlayingDesignOptions)[number]

export type Font = "NType" | "Roboto" | "Inter" | "GeistMono"
export type DefaultTheme = "system" | "light" | "dark"

export interface CustomTheme {
  id?: string
  name?: string
  colors?: Record<string, string>
}

export interface PreferenceStore {
  _hasHydrated: boolean
  _init: (state: PreferenceStore) => Promise<void>
  completedOnboarding: boolean
  language: string
  forceLTR: boolean
  accentFont: Font
  primaryFont: Font
  theme: DefaultTheme
  activeCustomThemeId: string | null
  activeCustomTheme: CustomTheme | null
  showNavbar: boolean
  homeTab: Tab
  tabsOrder: Tab[]
  tabsVisibility: Record<Tab, boolean>
  minAlbumLength: number
  miniplayerGestures: boolean
  dragClearPlayback: boolean
  nowPlayingDesign: NowPlayingDesign
  quickScroll: boolean
  squareArtwork: boolean
  playbackDelay: number
  continuePlaybackOnDismiss: boolean
  repeatOnSkip: boolean
  restoreLastPosition: boolean
  quickAddQueue: boolean
  quickFavorite: boolean
  rescanOnLaunch: boolean
  optimizedImageSave: boolean
  listAllow: string[]
  listBlock: string[]
  minSeconds: number
  separators: string[]
  checkForUpdates: boolean
  rcNotification: boolean
  downsamplingProcessor: boolean
  queueAwareNext: boolean
  waveformSlider: boolean
}

export const OmittedFields: string[] = [
  "_hasHydrated",
  "_init",
  "activeCustomTheme",
] satisfies Array<keyof PreferenceStore>
