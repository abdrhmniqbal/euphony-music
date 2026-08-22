export function isNumber(item: unknown): item is number {
  return typeof item === "number"
}

export function isString(item: unknown): item is string {
  return typeof item === "string"
}
