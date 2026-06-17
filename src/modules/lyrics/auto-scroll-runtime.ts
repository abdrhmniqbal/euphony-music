/**
 * Purpose: Schedules lyrics auto-scroll commands outside component effects.
 * Caller: LyricsView.
 * Dependencies: React Native ScrollView imperative adapter shape.
 * Main Functions: scheduleLyricsAutoScroll()
 * Side Effects: Calls ScrollView.scrollTo() after render.
 */

interface LyricsScrollAdapter {
  scrollTo: (options: { y: number; animated: boolean }) => void
}

interface LyricsAutoScrollOptions {
  key: string
  enabled: boolean
  scrollView: LyricsScrollAdapter | null
  measuredY: number | undefined
  fallbackY: number
  viewportHeight: number
}

let pendingOptions: LyricsAutoScrollOptions | null = null
let isScrollScheduled = false
let lastScrollKey: string | null = null

function runAfterRender(task: () => void) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(task)
    return
  }

  void Promise.resolve().then(task)
}

function scrollToActiveLine({
  key,
  enabled,
  scrollView,
  measuredY,
  fallbackY,
  viewportHeight,
}: LyricsAutoScrollOptions) {
  if (!enabled || !scrollView || key === lastScrollKey) {
    return
  }

  lastScrollKey = key
  const anchorY = Math.max(28, viewportHeight * 0.42)
  scrollView.scrollTo({
    y: Math.max(0, (measuredY ?? fallbackY) - anchorY),
    animated: true,
  })
}

export function scheduleLyricsAutoScroll(options: LyricsAutoScrollOptions) {
  pendingOptions = options

  if (isScrollScheduled) {
    return
  }

  isScrollScheduled = true
  runAfterRender(() => {
    isScrollScheduled = false
    const nextOptions = pendingOptions
    pendingOptions = null

    if (nextOptions) {
      scrollToActiveLine(nextOptions)
    }
  })
}
