import { ListGroup, Separator, Slider, Switch } from "heroui-native"
import { useEffect, useState } from "react"
import { ScrollView, Text, TextInput, View } from "react-native"

import {
  connectLastFmWithCredentials,
  disconnectLastFm,
  forgetLastFmCredentials,
  getLastFmIntegrationState,
  setLastFmScrobbleConfig,
  type LastFmIntegrationState,
} from "@/modules/settings/lastfm-integration"
import { showAppToast } from "@/modules/ui/toast"

export default function IntegrationsSettingsScreen() {
  const [state, setState] = useState<LastFmIntegrationState>({
    isConfigured: false,
    isConnected: false,
    scrobbleConfig: {
      isEnabled: false,
      minimumTrackDurationSeconds: 30,
      scrobbleDelayPercent: 15,
    },
  })
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    getLastFmIntegrationState().then((s) => {
      setState(s)
      setApiKey(s.apiKey || "")
      setIsLoading(false)
    })
  }, [])

  async function handleConnect() {
    const trimmedApiKey = apiKey.trim()
    const trimmedApiSecret = apiSecret.trim()
    const trimmedUsername = username.trim()

    if (!trimmedApiKey || !trimmedApiSecret || !trimmedUsername || !password) {
      showAppToast("Missing Details", "Enter API key, shared secret, username, and password.")
      return
    }

    setIsConnecting(true)
    try {
      const newState = await connectLastFmWithCredentials({
        apiKey: trimmedApiKey,
        apiSecret: trimmedApiSecret,
        username: trimmedUsername,
        password,
      })
      setState(newState)
      setApiSecret("")
      setUsername("")
      setPassword("")
      showAppToast("Connected", "Successfully connected to Last.fm.")
    } catch (error) {
      showAppToast(
        "Connection Failed",
        error instanceof Error ? error.message : "Could not connect to Last.fm."
      )
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDisconnect() {
    const newState = await disconnectLastFm()
    setState(newState)
    showAppToast("Disconnected", "Last.fm disconnected.")
  }

  async function handleForgetCredentials() {
    const newState = await forgetLastFmCredentials()
    setState(newState)
    setApiKey("")
    setApiSecret("")
    setUsername("")
    setPassword("")
    showAppToast("Removed", "Last.fm credentials removed.")
  }

  async function handleScrobbleToggle(isEnabled: boolean) {
    const newState = await setLastFmScrobbleConfig({ isEnabled })
    setState(newState)
  }

  async function handleScrobbleDelayChangeEnd(value: number) {
    const newState = await setLastFmScrobbleConfig({ scrobbleDelayPercent: value })
    setState(newState)
  }

  async function handleMinimumDurationChangeEnd(value: number) {
    const newState = await setLastFmScrobbleConfig({ minimumTrackDurationSeconds: value })
    setState(newState)
  }

  if (isLoading) {
    return <View className="flex-1 bg-background" />
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <View className="gap-2 px-1">
          <Text className="text-xs font-semibold uppercase text-muted">Last.fm</Text>
          <Text className="text-sm leading-5 text-muted">
            Connect with Last.fm mobile authentication. Your app key, shared secret, and session key are stored securely on this device. Password is sent to Last.fm over HTTPS and is not stored.
          </Text>
        </View>

        {state.isConnected ? (
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Scrobble Tracks</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  Automatically send listening history to Last.fm.
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isSelected={state.scrobbleConfig.isEnabled}
                  onSelectedChange={handleScrobbleToggle}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            
            {state.scrobbleConfig.isEnabled && (
              <>
                <Separator className="mx-4" />
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <View className="mb-3 flex-row items-center justify-between">
                      <ListGroup.ItemTitle>Scrobble Point</ListGroup.ItemTitle>
                      <Text className="text-sm font-medium text-foreground">
                        {state.scrobbleConfig.scrobbleDelayPercent}%
                      </Text>
                    </View>
                    <Slider
                      minValue={1}
                      maxValue={100}
                      step={1}
                      value={state.scrobbleConfig.scrobbleDelayPercent}
                      onChangeEnd={(value) => {
                        void handleScrobbleDelayChangeEnd(Array.isArray(value) ? (value[0] ?? 15) : value)
                      }}
                    >
                      <Slider.Track className="h-2 rounded-full bg-border">
                        <Slider.Fill className="rounded-full bg-accent" />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>
                    <Text className="mt-2 text-xs text-muted">
                      Percentage of track to play before scrobbling.
                    </Text>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
                <Separator className="mx-4" />
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <View className="mb-3 flex-row items-center justify-between">
                      <ListGroup.ItemTitle>Minimum Track Duration</ListGroup.ItemTitle>
                      <Text className="text-sm font-medium text-foreground">
                        {state.scrobbleConfig.minimumTrackDurationSeconds}s
                      </Text>
                    </View>
                    <Slider
                      minValue={10}
                      maxValue={120}
                      step={5}
                      value={state.scrobbleConfig.minimumTrackDurationSeconds}
                      onChangeEnd={(value) => {
                        void handleMinimumDurationChangeEnd(Array.isArray(value) ? (value[0] ?? 30) : value)
                      }}
                    >
                      <Slider.Track className="h-2 rounded-full bg-border">
                        <Slider.Fill className="rounded-full bg-accent" />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>
                    <Text className="mt-2 text-xs text-muted">
                      Tracks shorter than this will never be scrobbled.
                    </Text>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
              </>
            )}

            <Separator className="mx-4" />
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
          <View className="gap-3 rounded-[28px] border border-border/70 bg-default p-4">
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">API key</Text>
              <TextInput
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-base text-foreground"
                placeholder="Last.fm API key"
                placeholderTextColor="hsl(var(--muted))"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Shared secret</Text>
              <TextInput
                value={apiSecret}
                onChangeText={setApiSecret}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-base text-foreground"
                placeholder="Last.fm shared secret"
                placeholderTextColor="hsl(var(--muted))"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-base text-foreground"
                placeholder="Last.fm username"
                placeholderTextColor="hsl(var(--muted))"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
                className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-base text-foreground"
                placeholder="Last.fm password"
                placeholderTextColor="hsl(var(--muted))"
              />
            </View>
            <ListGroup>
              <ListGroup.Item onPress={handleConnect} disabled={isConnecting}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{isConnecting ? "Connecting..." : "Connect Last.fm"}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>Stores only API credentials and returned Last.fm session key.</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
              </ListGroup.Item>
              {state.isConfigured ? (
                <ListGroup.Item onPress={handleForgetCredentials}>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>Forget saved credentials</ListGroup.ItemTitle>
                    <ListGroup.ItemDescription>Remove stored API key and shared secret.</ListGroup.ItemDescription>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
              ) : null}
            </ListGroup>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
