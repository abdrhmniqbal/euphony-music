import { BottomSheet, Button, ListGroup, Separator, Slider, Switch } from "heroui-native"

import { useEffect, useMemo, useState } from "react"
import { ScrollView, Text, View } from "react-native"

import {
  connectLastFmWithCredentials,
  disconnectLastFm,
  forgetLastFmCredentials,
  getLastFmIntegrationState,
  setLastFmScrobbleConfig,
  type LastFmIntegrationState,
} from "@/modules/settings/lastfm-integration"
import { BottomSheetInput } from "@/components/ui/bottom-sheet-input"
import { showAppToast } from "@/modules/ui/toast"

export default function LastFmSettingsScreen() {
  const [state, setState] = useState<LastFmIntegrationState>({
    isConfigured: false,
    isConnected: false,
    scrobbleConfig: {
      isEnabled: false,
      minimumTrackDurationSeconds: 30,
      scrobbleDelayPercent: 30,
    },
  })
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false)

  const [delayPercentValue, setDelayPercentValue] = useState(30)
  const [durationSecondsValue, setDurationSecondsValue] = useState(30)

  function updateIntegrationState(newState: LastFmIntegrationState) {
    setState(newState)
    setDelayPercentValue(newState.scrobbleConfig.scrobbleDelayPercent)
    setDurationSecondsValue(newState.scrobbleConfig.minimumTrackDurationSeconds)
  }

  useEffect(() => {
    getLastFmIntegrationState().then((s) => {
      updateIntegrationState(s)
      setIsLoading(false)
    })
  }, [])

  const connectionDescription = useMemo(() => {
    if (!state.isConfigured) return "Last.fm auth unavailable."
    return state.isConnected
      ? state.username
        ? `Connected as ${state.username}`
        : "Connected."
      : "Not connected."
  }, [state])

  async function handleConnect() {
    const trimmedUsername = username.trim()
    if (!trimmedUsername || !password) {
      showAppToast("Missing Details", "Enter username and password.")
      return
    }

    setIsConnecting(true)
    try {
      const newState = await connectLastFmWithCredentials({
        username: trimmedUsername,
        password,
      })
      updateIntegrationState(newState)
      setUsername("")
      setPassword("")
      setIsAuthSheetOpen(false)
      showAppToast("Connected", "Successfully connected to Last.fm.")
    } catch (error) {
      showAppToast("Connection Failed", error instanceof Error ? error.message : "Could not connect to Last.fm.")
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDisconnect() {
    const newState = await disconnectLastFm()
    updateIntegrationState(newState)
    setIsAuthSheetOpen(false)
    showAppToast("Disconnected", "Last.fm disconnected.")
  }

  async function handleForgetCredentials() {
    const newState = await forgetLastFmCredentials()
    updateIntegrationState(newState)
    setUsername("")
    setPassword("")
    setIsAuthSheetOpen(false)
    showAppToast("Removed", "Last.fm credentials removed.")
  }

  async function handleScrobbleToggle(isEnabled: boolean) {
    const newState = await setLastFmScrobbleConfig({ isEnabled })
    updateIntegrationState(newState)
  }

  async function handleScrobbleDelayChangeEnd(value: number) {
    const newState = await setLastFmScrobbleConfig({ scrobbleDelayPercent: value })
    updateIntegrationState(newState)
  }

  async function handleMinimumDurationChangeEnd(value: number) {
    const newState = await setLastFmScrobbleConfig({ minimumTrackDurationSeconds: value })
    updateIntegrationState(newState)
  }

  function getSliderNumericValue(value: number | number[], fallback: number) {
    return Array.isArray(value) ? (value[0] ?? fallback) : value
  }

  if (isLoading) return <View className="flex-1 bg-background" />

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5 px-4 py-4">
          <ListGroup>
            <ListGroup.Item onPress={() => setIsAuthSheetOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Last.fm</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{connectionDescription}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>

          <ListGroup>
            <ListGroup.Item disabled={!state.isConnected} className={!state.isConnected ? "opacity-50" : ""}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Scrobble Tracks</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>Automatically send listening history to Last.fm.</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch isDisabled={!state.isConnected} isSelected={state.scrobbleConfig.isEnabled} onSelectedChange={handleScrobbleToggle} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            {state.scrobbleConfig.isEnabled && (
              <>
                <Separator className="mx-4" />
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <View className="mb-1 flex-row items-center justify-between">
                      <ListGroup.ItemTitle>Scrobble Point</ListGroup.ItemTitle>
                      <Text className="text-sm font-medium text-foreground">{delayPercentValue}%</Text>
                    </View>
                    <ListGroup.ItemDescription className="mb-3">
                      Tracks won't be scrobbled before {delayPercentValue}% elapsed time.
                    </ListGroup.ItemDescription>
                    <Slider minValue={15} maxValue={100} step={1} value={delayPercentValue} onChange={(value) => setDelayPercentValue(getSliderNumericValue(value, 30))} onChangeEnd={(value) => void handleScrobbleDelayChangeEnd(getSliderNumericValue(value, 30))}>
                      <Slider.Track className="h-2 rounded-full bg-border">
                        <Slider.Fill className="rounded-full bg-accent" />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
                <Separator className="mx-4" />
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <View className="mb-1 flex-row items-center justify-between">
                      <ListGroup.ItemTitle>Minimum Track Duration</ListGroup.ItemTitle>
                      <Text className="text-sm font-medium text-foreground">{durationSecondsValue}s</Text>
                    </View>
                    <ListGroup.ItemDescription className="mb-3">
                      Tracks shorter than this will not be scrobbled.
                    </ListGroup.ItemDescription>
                    <Slider minValue={10} maxValue={120} step={5} value={durationSecondsValue} onChange={(value) => setDurationSecondsValue(getSliderNumericValue(value, 30))} onChangeEnd={(value) => void handleMinimumDurationChangeEnd(getSliderNumericValue(value, 30))}>
                      <Slider.Track className="h-2 rounded-full bg-border">
                        <Slider.Fill className="rounded-full bg-accent" />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
              </>
            )}
          </ListGroup>

          {state.isConnected ? (
            <ListGroup>
              <ListGroup.Item onPress={handleForgetCredentials}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>Clear Last.fm Data</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>Remove saved session and scrobble settings.</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </ListGroup>
          ) : null}

        </View>
      </ScrollView>

      <BottomSheet isOpen={isAuthSheetOpen} onOpenChange={setIsAuthSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content backgroundClassName="bg-surface" keyboardBehavior="interactive" keyboardBlurBehavior="restore" enableBlurKeyboardOnGesture>
            {state.isConnected ? (
              <View className="gap-6 px-4">
                <View className="gap-1">
                  <Text className="text-lg font-semibold text-foreground">Last.fm profile</Text>
                  <Text className="text-sm text-muted">Connected and ready to scrobble.</Text>
                </View>
                <View className="gap-1">
                  <Text className="text-xs font-medium uppercase tracking-wide text-muted">Username</Text>
                  <Text className="text-base font-medium text-foreground">{state.username ?? "Connected account"}</Text>
                </View>
                <View className="gap-3 pt-2">
                  <Button variant="danger" onPress={handleDisconnect}>Unlink Last.fm</Button>
                </View>
              </View>
            ) : (
              <View className="gap-6 px-4">
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">Username</Text>
                  <BottomSheetInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} textContentType="username" placeholder="Last.fm username" returnKeyType="next" />
                </View>
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">Password</Text>
                  <BottomSheetInput value={password} onChangeText={setPassword} secureTextEntry textContentType="password" placeholder="Last.fm password" returnKeyType="done" onSubmitEditing={handleConnect} />
                </View>
                <View className="gap-3 pt-4">
                  <Button onPress={handleConnect} isDisabled={isConnecting}>{isConnecting ? "Connecting..." : "Connect"}</Button>
                </View>
              </View>
            )}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  )
}
