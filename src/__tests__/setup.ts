// Test setup — add mocks here manually when needed
// SAFETY: node's globalThis lacks React Native's __DEV__ flag, which modules read at import time
const globalScope = globalThis as { __DEV__?: boolean }
globalScope.__DEV__ = false

export {}
