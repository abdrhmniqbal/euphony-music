export const MINI_PLAYER_HEIGHT = 64
export const TAB_BAR_BASE_HEIGHT = 52
export const TAB_BAR_MIN_BOTTOM_PADDING = 8
export const TAB_BAR_BOTTOM_PADDING_MULTIPLIER = 2

export const ICON_SIZES = {
  listFallback: 28,
  mediumCardFallback: 44,
  largeCardFallback: 56,
  gridFallback: 48,
  sheetArtworkFallback: 36,
  emptyState: 48,
} as const

export function getTabBarBottomPadding(insetBottom: number): number {
  return Math.max(insetBottom, TAB_BAR_MIN_BOTTOM_PADDING) * TAB_BAR_BOTTOM_PADDING_MULTIPLIER
}

export function getTabBarHeight(insetBottom: number): number {
  return TAB_BAR_BASE_HEIGHT + getTabBarBottomPadding(insetBottom)
}

export const SCREEN_SECTION_TOP_SPACING = 20
export const SCREEN_SECTION_GAP = 16
export const DETAIL_HEADER_BOTTOM_SPACING = 24
export const TAB_SCREEN_BOTTOM_CLEARANCE = 24

// Tab screens scroll under the absolute-positioned tab bar and mini player, so their lists need matching tail padding
export function getTabScreenBottomPadding(insetBottom: number, hasMiniPlayer: boolean): number {
  return (
    getTabBarHeight(insetBottom) +
    (hasMiniPlayer ? MINI_PLAYER_HEIGHT : 0) +
    TAB_SCREEN_BOTTOM_CLEARANCE
  )
}
