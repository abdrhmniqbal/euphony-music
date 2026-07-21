/**
 * Purpose: Hydrates persisted language settings before rendering localized app content.
 * Caller: RootProviders.
 * Dependencies: React, react-i18next provider, i18next instance, and localization settings service.
 * Main Functions: LocalizationProvider()
 * Side Effects: Starts localization runtime initialization.
 */

import { type ReactNode, useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"

import { i18n } from "@/modules/localization/i18n"
import { initLocalization } from "@/modules/localization/language-settings"

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    initLocalization().then(() => setIsReady(true))
  }, [])

  if (!isReady) {
    return null
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
