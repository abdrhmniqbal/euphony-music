export const MINI_PLAYER_HEIGHT = 64
export const TAB_BAR_BASE_HEIGHT = 52
export const TAB_BAR_MIN_BOTTOM_PADDING = 8
export const TAB_BAR_BOTTOM_PADDING_MULTIPLIER = 2

export function getTabBarBottomPadding(insetBottom: number): number {
  return (
    Math.max(insetBottom, TAB_BAR_MIN_BOTTOM_PADDING) *
    TAB_BAR_BOTTOM_PADDING_MULTIPLIER
  )
}

export function getTabBarHeight(insetBottom: number): number {
  return TAB_BAR_BASE_HEIGHT + getTabBarBottomPadding(insetBottom)
}
