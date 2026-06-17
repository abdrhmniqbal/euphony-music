export type ScanningProgressStatus = "idle" | "in-progress" | "complete" | "error"

type Listener = () => void

const listeners = new Set<Listener>()

let snapshot = {
  status: "idle" as ScanningProgressStatus,
  error: null as Error | null,
}

function emit() {
  listeners.forEach((listener) => listener())
}

export function getScanningProgressSnapshot() {
  return snapshot
}

export function subscribeScanningProgress(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setScanningProgress(next: typeof snapshot) {
  snapshot = next
  emit()
}
