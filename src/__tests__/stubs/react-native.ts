const rtlState = { isRTL: false, allowRTL: true }

export const I18nManager = {
  get isRTL() {
    return rtlState.isRTL
  },
  allowRTL(allowed: boolean) {
    rtlState.allowRTL = allowed
  },
  forceRTL(forced: boolean) {
    rtlState.isRTL = forced
  },
}
