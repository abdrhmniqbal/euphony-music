/**
 * Purpose: Provides preference togglers copied from reference flow and adapted to Startune dependencies.
 * Caller: Settings UI adapters and playback setup.
 * Dependencies: AudioBrowser options, preference store, playback store.
 * Main Functions: toggleKey(), toggleContinuePlaybackOnDismiss(), toggleDownsamplingProcessor(), toggleForceLTR(), toggleQueueAwareNext(), toggleWaveformSlider().
 * Side Effects: Updates preference state, AudioBrowser options, and RTL config.
 */

import { I18nManager } from "react-native"
import AudioBrowser from "react-native-audio-browser"

import { getAudioBrowserOptions } from "@/lib/react-native-audio-browser"
import { i18n } from "@/modules/localization/i18n"
import { playbackStore } from "@/stores/playback/store"
import { preferenceStore } from "../store"

type ToggleableKey =
  | "checkForUpdates"
  | "dragClearPlayback"
  | "quickAddQueue"
  | "quickFavorite"
  | "quickScroll"
  | "miniplayerGestures"
  | "optimizedImageSave"
  | "rcNotification"
  | "rescanOnLaunch"
  | "repeatOnSkip"
  | "restoreLastPosition"
  | "showNavbar"
  | "squareArtwork"

export function toggleKey(key: ToggleableKey) {
  return () => {
    preferenceStore.setState((previousState) => ({
      [key]: !previousState[key],
    }))
  }
}

export async function toggleContinuePlaybackOnDismiss() {
  const nextState = !preferenceStore.getState().continuePlaybackOnDismiss
  preferenceStore.setState({ continuePlaybackOnDismiss: nextState })
  AudioBrowser.updateOptions(
    getAudioBrowserOptions({ continuePlaybackOnDismiss: nextState })
  )
}

export async function toggleDownsamplingProcessor() {
  const nextState = !preferenceStore.getState().downsamplingProcessor
  preferenceStore.setState({ downsamplingProcessor: nextState })
}

export function toggleForceLTR() {
  const nextState = !preferenceStore.getState().forceLTR
  preferenceStore.setState({ forceLTR: nextState })
  I18nManager.allowRTL(nextState ? false : i18n.dir() === "rtl")
  I18nManager.forceRTL(nextState ? false : i18n.dir() === "rtl")
}

export function toggleQueueAwareNext() {
  preferenceStore.setState((previousState) => ({
    queueAwareNext: !previousState.queueAwareNext,
  }))
  playbackStore.setState({ numQueuedNext: 0 })
}

export async function toggleWaveformSlider() {
  const nextState = !preferenceStore.getState().waveformSlider
  preferenceStore.setState({ waveformSlider: nextState })
}
