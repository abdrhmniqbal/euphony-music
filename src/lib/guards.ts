/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- this module is the app's single I/O boundary: validating unparsed values requires unknown inputs and Record<string, unknown> narrowing */

/**
 * Runtime validators for unparsed input at I/O boundaries (JSON payloads,
 * storage values, deep links). Each guard establishes the contract that
 * TypeScript cannot see across the boundary.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isString(value: unknown): value is string {
  return typeof value === "string"
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number"
}
