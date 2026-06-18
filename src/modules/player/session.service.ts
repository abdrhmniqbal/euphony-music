/**
 * Purpose: Public compatibility facade for playback session service.
 * Caller: Existing imports that still reference session.service.
 * Dependencies: Player session module.
 * Main Functions: Re-exports session service API.
 * Side Effects: None directly.
 */

export * from "./session/service"
