import * as Linking from "expo-linking"
import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { ListGroup } from "heroui-native"
import { useEffect, useState, useRef } from "react"
import { AppState, ScrollView, View, Text } from "react-native"

import {
  getLastFmIntegrationState,
  isLastFmConfigured,
  openLastFmAuth,
  completeLastFmAuth,
  disconnectLastFm,
  type LastFmIntegrationState,
} from "@/modules/settings/lastfm-integration"
import { showAppToast } from "@/modules/ui/toast"

export default function IntegrationsSettingsScreen() {
  const router = useRouter()
  const [state, setState] = useState<LastFmIntegrationState>({
    isConfigured: isLastFmConfigured(),
    isConnected: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    getLastFmIntegrationState().then((s) => {
      setState(s)
      if (s.pendingToken && !s.isConnected) {
        setIsAuthenticating(true)
      }
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        isAuthenticating
      ) {
        completeLastFmAuth()
          .then((newState) => {
            setState(newState)
            showAppToast("Connected", "Successfully connected to Last.fm.")
          })
          .catch(() => {
            // It's possible they didn't authorize or cancelled, fail silently or show small toast
          })
          .finally(() => {
            setIsAuthenticating(false)
          })
      }

      appState.current = nextAppState
    })

    return () => subscription.remove()
  }, [isAuthenticating])

  async function handleConnect() {
    setIsAuthenticating(true)
    try {
      const newState = await openLastFmAuth()
      setState(newState)
    } catch {
      setIsAuthenticating(false)
      showAppToast("Error", "Could not start Last.fm authorization.")
    }
  }

  async function handleDisconnect() {
    const newState = await disconnectLastFm()
    setState(newState)
    setIsAuthenticating(false)
    showAppToast("Disconnected", "Last.fm disconnected.")
  }

  if (isLoading) {
    return <View className="flex-1 bg-background" />
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <Text className="px-1 text-xs font-semibold uppercase text-muted">Last.fm</Text>

        {!state.isConfigured ? (
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Not Configured</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  EXPO_PUBLIC_LASTFM_API_KEY and EXPO_PUBLIC_LASTFM_API_SECRET missing.
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </ListGroup>
        ) : state.isConnected ? (
          <ListGroup>
            <ListGroup.Item onPress={handleDisconnect}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Connected</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {state.username ? `Connected as ${state.username}` : "Account linked for scrobbling."}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Text className="text-sm font-medium text-danger">Disconnect</Text>
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        ) : (
          <ListGroup>
            <ListGroup.Item onPress={handleConnect} disabled={isAuthenticating}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Connect Last.fm</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {isAuthenticating ? "Waiting for authorization..." : "Link account to enable scrobbling."}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </ListGroup>
        )}
      </View>
    </ScrollView>
  )
}
