// AudioBrowser.setupPlayer() throws a fixed English message when called again
// after the native player is already initialized (common during dev HMR).
// Our isPlayerReady / setupPlayerPromise guards in service.ts already prevent
// our own re-entry, so this only fires from native-side re-init we didn't cause.
export function isAlreadyInitializedError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("already been initialized")
}
