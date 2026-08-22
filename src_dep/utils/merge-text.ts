type MergeTextValue = string | number | null | undefined | false

export function mergeText(values: MergeTextValue[], separator = " • "): string {
  return values
    .map((value) => {
      if (value == null || value === false) {
        return ""
      }

      return String(value).trim()
    })
    .filter((value) => value.length > 0)
    .join(separator)
}
