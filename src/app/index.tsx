import { Redirect } from "expo-router"

import { getPreferenceState } from "@/core/preferences/store"

export default function RootIndex() {
  if (!getPreferenceState().completedOnboarding) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href="/(main)/(home)" />
}
