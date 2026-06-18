/**
 * Purpose: Stores app update prompt visibility and selected release details.
 * Caller: Update runtime, About settings manual check, and AppUpdateSheet.
 * Dependencies: Zustand and app update service types.
 * Main Functions: useAppUpdatePromptStore, openAppUpdatePrompt(), closeAppUpdatePrompt()
 * Side Effects: Mutates in-memory update prompt state.
 */

import { create } from "zustand"

import type { AppUpdateInfo } from "@/modules/updates/app-update-service"

interface AppUpdatePromptState {
  isOpen: boolean
  updateInfo: AppUpdateInfo | null
}

export const useAppUpdatePromptStore = create<AppUpdatePromptState>(() => ({
  isOpen: false,
  updateInfo: null,
}))

export function openAppUpdatePrompt(updateInfo: AppUpdateInfo) {
  useAppUpdatePromptStore.setState({
    isOpen: true,
    updateInfo,
  })
}

export function closeAppUpdatePrompt() {
  useAppUpdatePromptStore.setState({ isOpen: false })
}
