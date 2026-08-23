import { I18nManager } from "react-native"
import { Uniwind } from "uniwind"

import { i18n } from "@/core/localization/i18n"
import type { LanguageCode } from "@/core/localization/types"
import { preferenceStore } from "@/core/preferences/store"

export interface LanguageOption {
  code: LanguageCode
  labelKey: string
  nativeLabelKey: string
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "en",
    labelKey: "settings.language.english",
    nativeLabelKey: "settings.language.englishNative",
  },
  {
    code: "id",
    labelKey: "settings.language.indonesian",
    nativeLabelKey: "settings.language.indonesianNative",
  },
  {
    code: "hi",
    labelKey: "settings.language.hindi",
    nativeLabelKey: "settings.language.hindiNative",
  },
  {
    code: "zh-Hans",
    labelKey: "settings.language.chineseSimplified",
    nativeLabelKey: "settings.language.chineseSimplifiedNative",
  },
  {
    code: "zh-Hant",
    labelKey: "settings.language.chineseTraditional",
    nativeLabelKey: "settings.language.chineseTraditionalNative",
  },
  {
    code: "ja",
    labelKey: "settings.language.japanese",
    nativeLabelKey: "settings.language.japaneseNative",
  },
  {
    code: "ru",
    labelKey: "settings.language.russian",
    nativeLabelKey: "settings.language.russianNative",
  },
  {
    code: "de",
    labelKey: "settings.language.german",
    nativeLabelKey: "settings.language.germanNative",
  },
  {
    code: "fr",
    labelKey: "settings.language.french",
    nativeLabelKey: "settings.language.frenchNative",
  },
  {
    code: "ko",
    labelKey: "settings.language.korean",
    nativeLabelKey: "settings.language.koreanNative",
  },
  {
    code: "it",
    labelKey: "settings.language.italian",
    nativeLabelKey: "settings.language.italianNative",
  },
  {
    code: "es",
    labelKey: "settings.language.spanish",
    nativeLabelKey: "settings.language.spanishNative",
  },
  {
    code: "nl",
    labelKey: "settings.language.dutch",
    nativeLabelKey: "settings.language.dutchNative",
  },
  {
    code: "pt-BR",
    labelKey: "settings.language.portugueseBrazil",
    nativeLabelKey: "settings.language.portugueseBrazilNative",
  },
]

export function getLanguageOptions(): LanguageOption[] {
  return LANGUAGE_OPTIONS
}

const RTL_LANGUAGE_CODES: LanguageCode[] = []

export async function setLanguageCode(code: LanguageCode): Promise<void> {
  preferenceStore.setState({ language: code })
  await i18n.changeLanguage(code)

  const shouldBeRtl = RTL_LANGUAGE_CODES.includes(code)
  if (I18nManager.isRTL !== shouldBeRtl) {
    Uniwind.setTheme(preferenceStore.getState().themeMode)
    I18nManager.allowRTL(shouldBeRtl)
    I18nManager.forceRTL(shouldBeRtl)
  }
}
