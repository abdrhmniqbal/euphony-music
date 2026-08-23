import { create } from "zustand"

import type { AppUpdateInfo } from "@/domains/updates/app-update-service"

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
