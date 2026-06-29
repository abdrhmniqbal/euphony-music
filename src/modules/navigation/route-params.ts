export interface SafeRouteName {
  value: string
  raw: string
  decodeFailed: boolean
}

export function getSafeRouteName(value: string | string[] | undefined): SafeRouteName {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
  try {
    return {
      value: decodeURIComponent(raw),
      raw,
      decodeFailed: false,
    }
  } catch {
    return {
      value: raw,
      raw,
      decodeFailed: true,
    }
  }
}
