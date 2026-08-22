/**
 * Purpose: Coordinates app bootstrap readiness, logging initialization, and automatic indexer scan execution.
 * Caller: root layout, app lifecycle listeners, and external playback handoff.
 * Dependencies: bootstrap utilities, logging service, indexer runtime/service.
 * Main Functions: ensureLoggingInitialized(), completeBootstrap(), waitForBootstrapComplete(), handleBootstrapDatabaseReady(), handleBootstrapDatabaseError()
 * Side Effects: Initializes logging/bootstrap workflow, updates in-memory readiness state, may start media indexing.
 */

import { bootstrapApp } from "@/modules/bootstrap/utils"
import { initializeLogging, logError, logInfo, logWarn } from "@/modules/logging/service"

type DatabaseStatus = "pending" | "ready" | "error"

let loggingInitializationPromise: Promise<void> | null = null
let databaseStatus: DatabaseStatus = "pending"
let isBootstrapped = false
let bootstrapCompletion: Promise<void> | null = null
let resolveBootstrapCompletion: (() => void) | null = null
let rejectBootstrapCompletion: ((error: Error) => void) | null = null

export function ensureLoggingInitialized() {
  if (loggingInitializationPromise) {
    return loggingInitializationPromise
  }

  loggingInitializationPromise = initializeLogging().catch((error) => {
    loggingInitializationPromise = null
    throw error
  })

  return loggingInitializationPromise
}

export function waitForBootstrapComplete(): Promise<void> {
  if (isBootstrapped) {
    return Promise.resolve()
  }

  if (!bootstrapCompletion) {
    bootstrapCompletion = new Promise<void>((resolve, reject) => {
      resolveBootstrapCompletion = resolve
      rejectBootstrapCompletion = reject
    })
  }

  return bootstrapCompletion
}

async function completeBootstrap() {
  if (databaseStatus !== "ready" || isBootstrapped) {
    return
  }

  const completion = waitForBootstrapComplete()

  try {
    await ensureLoggingInitialized()
    logInfo("App bootstrap started")
    await bootstrapApp()
    logInfo("App bootstrap completed")
  } catch (error) {
    logError("App bootstrap failed", error)
  } finally {
    isBootstrapped = true
    resolveBootstrapCompletion?.()
    resolveBootstrapCompletion = null
    rejectBootstrapCompletion = null
    bootstrapCompletion = null
  }

  await completion
}

export async function handleBootstrapDatabaseReady() {
  if (databaseStatus !== "pending") {
    return
  }

  databaseStatus = "ready"
  logInfo("Database marked ready for bootstrap")
  await completeBootstrap()
}

export function handleBootstrapDatabaseError() {
  if (databaseStatus === "error") {
    return
  }

  databaseStatus = "error"
  if (!bootstrapCompletion) {
    bootstrapCompletion = new Promise<void>((resolve, reject) => {
      resolveBootstrapCompletion = resolve
      rejectBootstrapCompletion = reject
    })
  }
  rejectBootstrapCompletion?.(new Error("Database failed before bootstrap completed"))
  rejectBootstrapCompletion = null
  logWarn("Database failed before bootstrap completed")
}
