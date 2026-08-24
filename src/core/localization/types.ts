export type LanguageCode =
  | "en"
  | "id"
  | "hi"
  | "zh-Hans"
  | "zh-Hant"
  | "ja"
  | "ru"
  | "de"
  | "fr"
  | "ko"
  | "it"
  | "es"
  | "nl"
  | "pt-BR"

export const DEFAULT_LANGUAGE_CODE: LanguageCode = "en"

export const SUPPORTED_LANGUAGE_CODES: LanguageCode[] = [
  "en",
  "id",
  "hi",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ru",
  "de",
  "fr",
  "ko",
  "it",
  "es",
  "nl",
  "pt-BR",
]

/* oxlint-disable anti-slop/no-unknown-parameters -- locale codes arrive unparsed from the OS and persisted settings */

export function isSupportedLanguageCode(value: unknown): value is LanguageCode {
  // SAFETY: includes compares by runtime equality, so any string can be tested against the union
  return typeof value === "string" && SUPPORTED_LANGUAGE_CODES.includes(value as LanguageCode)
}
