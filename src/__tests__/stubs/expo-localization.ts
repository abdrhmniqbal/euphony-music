export interface StubLocale {
  languageCode?: string | null
  regionCode?: string | null
  scriptCode?: string | null
}

let locales: StubLocale[] = []

export function getLocales(): StubLocale[] {
  return locales
}

export function setLocales(next: StubLocale[]) {
  locales = next
}

export const locale = "en"
