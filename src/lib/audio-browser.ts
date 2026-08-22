import type { UpdateOptions } from "react-native-audio-browser"
import AudioBrowser from "react-native-audio-browser"

type AdditionalConfig = {
  continuePlaybackOnDismiss?: boolean
}

export function getAudioBrowserOptions(options?: AdditionalConfig): UpdateOptions {
  const config = { ...DEFAULT_CONFIG, ...options }

  return {
    android: {
      appKilledPlaybackBehavior: config.continuePlaybackOnDismiss
        ? "continue-playback"
        : "stop-playback-and-remove-notification",
    },
    capabilities: {
      stop: false,
      jumpForward: false,
      jumpBackward: false,
      favorite: false,
      shuffleMode: false,
      repeatMode: false,
      playbackRate: false,
    },
    progressUpdateEventInterval: 0.5,
  }
}

const DEFAULT_CONFIG: Required<AdditionalConfig> = {
  continuePlaybackOnDismiss: true,
}

const UNLOADED_STATES = ["none", "stopped"]

export async function isAudioBrowserSetUp() {
  try {
    return !UNLOADED_STATES.includes(AudioBrowser.getPlayback().state)
  } catch {
    return false
  }
}
