import {
  BottomSheet,
  Button,
  Input,
  ListGroup,
  Separator,
  Slider,
  useThemeColor,
} from "heroui-native"
import { Switch } from "@/components/ui/switch"
import * as React from "react"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import {
  connectLastFmWithCredentials,
  disconnectLastFm,
  forgetLastFmCredentials,
  getLastFmIntegrationState,
  setLastFmScrobbleConfig,
  type LastFmIntegrationState,
} from "@/domains/lastfm/integration"
import { showAppToast } from "@/core/ui/toast"

function getSliderNumericValue(value: number | number[], fallback: number) {
  return Array.isArray(value) ? (value[0] ?? fallback) : value
}

export function LastFmSettings() {
  const accent = useThemeColor("accent")
  const { t } = useTranslation()
  const [state, setState] = React.useState<LastFmIntegrationState>({
    isConfigured: true,
    isConnected: false,
    scrobbleConfig: {
      isEnabled: false,
      minimumTrackDurationSeconds: 30,
      scrobbleDelayPercent: 30,
    },
  })
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [isAuthSheetOpen, setIsAuthSheetOpen] = React.useState(false)
  const [delayPercentValue, setDelayPercentValue] = React.useState(30)
  const [durationSecondsValue, setDurationSecondsValue] = React.useState(30)

  function updateIntegrationState(newState: LastFmIntegrationState) {
    setState(newState)
    setDelayPercentValue(newState.scrobbleConfig.scrobbleDelayPercent)
    setDurationSecondsValue(newState.scrobbleConfig.minimumTrackDurationSeconds)
  }

  React.useEffect(() => {
    let active = true
    getLastFmIntegrationState().then((s) => {
      if (!active) return
      updateIntegrationState(s)
      setIsLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const connectionDescription = React.useMemo(() => {
    if (!state.isConfigured) return t("settings.lastfm.authUnavailable")
    return state.isConnected
      ? state.username
        ? t("settings.lastfm.connectedAs", { username: state.username })
        : t("settings.lastfm.connected")
      : t("settings.lastfm.notConnected")
  }, [state, t])

  async function handleConnect() {
    const trimmedUsername = username.trim()
    if (!trimmedUsername || !password) {
      showAppToast(
        t("settings.lastfm.missingDetails"),
        t("settings.lastfm.missingDetailsDescription")
      )
      return
    }

    setIsConnecting(true)
    try {
      const newState = await connectLastFmWithCredentials({
        username: trimmedUsername,
        password,
      })
      updateIntegrationState(newState)
      setPassword("")
      setIsAuthSheetOpen(false)
      showAppToast(
        t("settings.lastfm.connectSuccessTitle"),
        t("settings.lastfm.connectedAs", { username: newState.username ?? "" })
      )
    } catch (error) {
      showAppToast(
        t("settings.lastfm.connectFailedTitle"),
        error instanceof Error ? error.message : t("settings.advanced.tryAgainDescription")
      )
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDisconnect() {
    try {
      const newState = await disconnectLastFm()
      updateIntegrationState(newState)
      showAppToast(t("settings.lastfm.unlinked"), t("settings.lastfm.readyToScrobble"))
    } catch {
      showAppToast(
        t("settings.lastfm.connectFailedTitle"),
        t("settings.advanced.tryAgainDescription")
      )
    }
  }

  async function handleClearData() {
    try {
      const newState = await forgetLastFmCredentials()
      updateIntegrationState(newState)
      setUsername("")
      setPassword("")
      showAppToast(t("settings.lastfm.clearDataSuccessTitle"), t("settings.lastfm.readyToScrobble"))
    } catch {
      showAppToast(
        t("settings.lastfm.connectFailedTitle"),
        t("settings.advanced.tryAgainDescription")
      )
    }
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

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="gap-5 px-4 py-4">
          <View className="gap-2">
            <Text className="px-1 text-xs font-semibold uppercase text-muted">
              {t("settings.routes.lastfm.title")}
            </Text>
            <ListGroup>
              <ListGroup.Item onPress={() => setIsAuthSheetOpen(true)} disabled={isLoading}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t("settings.routes.lastfm.title")}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>{connectionDescription}</ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
              </ListGroup.Item>
            </ListGroup>
          </View>

          <View className="gap-2">
            <Text className="px-1 text-xs font-semibold uppercase text-muted">
              {t("settings.lastfm.scrobbling")}
            </Text>
            <ListGroup>
              <ListGroup.Item>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t("settings.lastfm.scrobbleTracks")}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {t("settings.lastfm.scrobbleTracksDescription")}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix>
                  <Switch
                    isSelected={state.scrobbleConfig.isEnabled}
                    onSelectedChange={(isSelected) => void handleScrobbleToggle(isSelected)}
                    isDisabled={!state.isConnected}
                  />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>

              {state.scrobbleConfig.isEnabled ? (
                <>
                  <Separator className="mx-4" />
                  <ListGroup.Item>
                    <ListGroup.ItemContent>
                      <View className="mb-3 flex-row items-center justify-between">
                        <ListGroup.ItemTitle>
                          {t("settings.lastfm.scrobblePoint")}
                        </ListGroup.ItemTitle>
                        <Text className="text-sm font-medium text-foreground">
                          {delayPercentValue}%
                        </Text>
                      </View>
                      <Slider
                        minValue={15}
                        maxValue={100}
                        step={5}
                        value={delayPercentValue}
                        onChange={(value) => setDelayPercentValue(getSliderNumericValue(value, 30))}
                        onChangeEnd={(value) => {
                          void handleScrobbleDelayChangeEnd(getSliderNumericValue(value, 30))
                        }}
                      >
                        <Slider.Track className="h-2 rounded-full bg-border">
                          <Slider.Fill className="rounded-full bg-accent" />
                          <Slider.Thumb />
                        </Slider.Track>
                      </Slider>
                      <Text className="mt-2 text-xs text-muted">
                        {t("settings.lastfm.scrobblePointDescription")}
                      </Text>
                    </ListGroup.ItemContent>
                  </ListGroup.Item>

                  <Separator className="mx-4" />
                  <ListGroup.Item>
                    <ListGroup.ItemContent>
                      <View className="mb-3 flex-row items-center justify-between">
                        <ListGroup.ItemTitle>
                          {t("settings.lastfm.minimumTrackDuration")}
                        </ListGroup.ItemTitle>
                        <Text className="text-sm font-medium text-foreground">
                          {durationSecondsValue}s
                        </Text>
                      </View>
                      <Slider
                        minValue={10}
                        maxValue={300}
                        step={5}
                        value={durationSecondsValue}
                        onChange={(value) =>
                          setDurationSecondsValue(getSliderNumericValue(value, 30))
                        }
                        onChangeEnd={(value) => {
                          void handleMinimumDurationChangeEnd(getSliderNumericValue(value, 30))
                        }}
                      >
                        <Slider.Track className="h-2 rounded-full bg-border">
                          <Slider.Fill className="rounded-full bg-accent" />
                          <Slider.Thumb />
                        </Slider.Track>
                      </Slider>
                      <Text className="mt-2 text-xs text-muted">
                        {t("settings.lastfm.minimumTrackDurationDescription")}
                      </Text>
                    </ListGroup.ItemContent>
                  </ListGroup.Item>
                </>
              ) : null}

              <Separator className="mx-4" />
              <ListGroup.Item onPress={() => void handleClearData()}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t("settings.lastfm.clearData")}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {t("settings.lastfm.clearDataDescription")}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </ListGroup>
          </View>
        </View>
      </ScrollView>

      <BottomSheet isOpen={isAuthSheetOpen} onOpenChange={setIsAuthSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay isCloseOnPress />
          <BottomSheet.Content
            backgroundClassName="bg-surface"
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            enableBlurKeyboardOnGesture
          >
            <BottomSheet.Title className="mb-1 text-xl">
              {t("settings.lastfm.profileTitle")}
            </BottomSheet.Title>
            <Text className="mb-4 text-sm text-muted">{t("settings.lastfm.readyToScrobble")}</Text>

            {state.isConnected ? (
              <View className="gap-4">
                <View className="gap-1">
                  <Text className="text-xs font-medium uppercase tracking-wide text-muted">
                    {t("settings.lastfm.connectedAccount")}
                  </Text>
                  <Text className="text-base font-medium text-foreground">
                    {state.username ?? t("common.unknown")}
                  </Text>
                </View>
                <Button variant="secondary" onPress={() => void handleDisconnect()}>
                  {t("settings.lastfm.unlink")}
                </Button>
              </View>
            ) : (
              <View className="gap-4">
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    {t("settings.lastfm.username")}
                  </Text>
                  <Input
                    value={username}
                    onChangeText={setUsername}
                    placeholder={t("settings.lastfm.usernamePlaceholder")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor={accent}
                  />
                </View>
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    {t("settings.lastfm.password")}
                  </Text>
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t("settings.lastfm.passwordPlaceholder")}
                    secureTextEntry
                    selectionColor={accent}
                  />
                </View>
                <Button onPress={() => void handleConnect()} isDisabled={isConnecting}>
                  {isConnecting ? t("settings.lastfm.connecting") : t("settings.lastfm.connect")}
                </Button>
              </View>
            )}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  )
}
