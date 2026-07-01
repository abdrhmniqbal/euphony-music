/**
 * Purpose: Coordinates app bootstrap readiness, logging initialization, and automatic indexer scan execution.
 * Caller: root layout, app lifecycle listeners, and external playback handoff.
 * Dependencies: media-library permissions, bootstrap utilities, indexer scan settings, indexer runtime/service, logging service.
 * Main Functions: ensureLoggingInitialized(), completeBootstrap(), waitForBootstrapComplete(), handleBootstrapDatabaseReady(), runAutoScan()
 * Side Effects: Initializes logging/bootstrap workflow, updates in-memory readiness state, may start media indexing.
 */

import { bootstrapApp } from "@/modules/bootstrap/utils"
import { initializeLogging, logError, logInfo, logWarn } from "@/modules/logging/service"

type DatabaseStatus = "pending" | "ready" | "error"

let loggingInitializationPromise: Promise<void> | null = null
let bootstrapPromise: Promise<void> | null = null
let databaseStatus: DatabaseStatus = "pending"
let isBootstrapped = false
let bootstrapWaiters: Array<{
  resolve: () => void
  reject: (error: Error) => void
}> = []

function resolveBootstrapWaiters() {
  const waiters = bootstrapWaiters
  bootstrapWaiters = []
  waiters.forEach((waiter) => waiter.resolve())
}

function rejectBootstrapWaiters(error: Error) {
  const waiters = bootstrapWaiters
  bootstrapWaiters = []
  waiters.forEach((waiter) => waiter.reject(error))
}

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

async function completeBootstrap() {
  if (databaseStatus !== "ready") {
    return
  }

  if (isBootstrapped) {
    return
  }

  if (bootstrapPromise) {
    await bootstrapPromise
    return
  }

  bootstrapPromise = (async () => {
    try {
      await ensureLoggingInitialized()
      logInfo("App bootstrap started")
      await bootstrapApp()
      logInfo("App bootstrap completed")
    } catch (error) {
      logError("App bootstrap failed", error)
    } finally {
      isBootstrapped = true
      resolveBootstrapWaiters()
      bootstrapPromise = null
    }
  })()

  await bootstrapPromise
}

export function waitForBootstrapComplete() {
  if (isBootstrapped) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    bootstrapWaiters.push({ resolve, reject })
  })
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
  rejectBootstrapWaiters(new Error("Database failed before bootstrap completed"))
  logWarn("Database failed before bootstrap completed")
}


