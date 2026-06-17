/**
 * Purpose: Hydrates persisted language settings before rendering localized app content.
 * Caller: RootProviders.
 * Dependencies: React, react-i18next provider, i18next instance, and localization runtime state.
 * Main Functions: LocalizationProvider()
 * Side Effects: Starts localization runtime initialization.
 */

import { type ReactNode, useSyncExternalStore } from "react"
import { I18nextProvider } from "react-i18next"

import { i18n } from "@/modules/localization/i18n"
import {
  ensureLocalizationInitialized,
  getLocalizationReadySnapshot,
  subscribeLocalizationReady,
} from "@/modules/localization/runtime"

export function LocalizationProvider({ children }: { children: ReactNode }) {
  void ensureLocalizationInitialized()
  const isReady = useSyncExternalStore(
    subscribeLocalizationReady,
    getLocalizationReadySnapshot,
    getLocalizationReadySnapshot
  )

  if (!isReady) {
    return null
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
