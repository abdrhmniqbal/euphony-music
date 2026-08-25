import { Redirect } from "expo-router"

import { usePreferenceStore } from "@/core/preferences/store"

export default function RootIndex() {
  const hasHydrated = usePreferenceStore((state) => state._hasHydrated)
  const completedOnboarding = usePreferenceStore((state) => state.completedOnboarding)

  // Routing on unhydrated defaults would bounce completed users to onboarding (async kv-store read)
  if (!hasHydrated) {
    return null
  }

  if (!completedOnboarding) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href="/(main)/(home)" />
}
