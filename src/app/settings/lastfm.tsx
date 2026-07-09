import { BottomSheet, Button, ListGroup, Separator, Slider, Switch } from "heroui-native"

import { useEffect, useMemo, useState } from "react"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

import {
  connectLastFmWithCredentials,
  disconnectLastFm,
  forgetLastFmCredentials,
  getLastFmIntegrationState,
  setLastFmScrobbleConfig,
  type LastFmIntegrationState,
} from "@/modules/settings/lastfm-integration"
import { BottomSheetInput } from "@/modules/shared/components/ui/bottom-sheet-input"
import { SettingsHighlight, SettingsScrollView } from "@/modules/settings/ui"
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

  const { t } = useTranslation()

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
      setUsername("")
      setPassword("")
      setIsAuthSheetOpen(false)
      showAppToast(
        t("settings.lastfm.connectedToast"),
        t("settings.lastfm.connectedToastDescription")
      )
    } catch (error) {
      showAppToast(
        t("settings.lastfm.connectionFailed"),
        error instanceof Error ? error.message : t("settings.lastfm.connectionFailedDescription")
      )
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleDisconnect() {
    const newState = await disconnectLastFm()
    updateIntegrationState(newState)
    setIsAuthSheetOpen(false)
    showAppToast(t("settings.lastfm.disconnected"), t("settings.lastfm.disconnectedDescription"))
  }

  async function handleForgetCredentials() {
    const newState = await forgetLastFmCredentials()
    updateIntegrationState(newState)
    setUsername("")
    setPassword("")
    setIsAuthSheetOpen(false)
    showAppToast(t("settings.lastfm.removed"), t("settings.lastfm.removedDescription"))
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
      <SettingsScrollView>
        <ListGroup>
          <SettingsHighlight id="connection">
            <ListGroup.Item onPress={() => setIsAuthSheetOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.routes.lastfm.title")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{connectionDescription}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </SettingsHighlight>
        </ListGroup>

        <ListGroup>
          <SettingsHighlight id="scrobble">
            <ListGroup.Item
              disabled={!state.isConnected}
              className={!state.isConnected ? "opacity-50" : ""}
            >
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t("settings.lastfm.scrobbleTracks")}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {t("settings.lastfm.scrobbleTracksDescription")}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isDisabled={!state.isConnected}
                  isSelected={state.scrobbleConfig.isEnabled}
                  onSelectedChange={handleScrobbleToggle}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </SettingsHighlight>
          {state.scrobbleConfig.isEnabled && (
            <>
              <Separator className="mx-4" />
              <SettingsHighlight id="scrobblePoint">
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <View className="mb-1 flex-row items-center justify-between">
                      <ListGroup.ItemTitle>
                        {t("settings.lastfm.scrobblePoint")}
                      </ListGroup.ItemTitle>
                      <Text className="text-sm font-medium text-foreground">
                        {delayPercentValue}%
                      </Text>
                    </View>
                    <ListGroup.ItemDescription className="mb-3">
                      {t("settings.lastfm.scrobblePointDescription")}
                    </ListGroup.ItemDescription>
                    <Slider
                      minValue={15}
                      maxValue={100}
                      step={1}
                      value={delayPercentValue}
                      onChange={(value) => setDelayPercentValue(getSliderNumericValue(value, 30))}
                      onChangeEnd={(value) =>
                        void handleScrobbleDelayChangeEnd(getSliderNumericValue(value, 30))
                      }
                    >
                      <Slider.Track className="h-2 rounded-full bg-border">
                        <Slider.Fill className="rounded-full bg-accent" />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
              </SettingsHighlight>
              <Separator className="mx-4" />
              <SettingsHighlight id="minimumTrackDuration">
                <ListGroup.Item>
                  <ListGroup.ItemContent>
                    <View className="mb-1 flex-row items-center justify-between">
                      <ListGroup.ItemTitle>
                        {t("settings.lastfm.minimumTrackDuration")}
                      </ListGroup.ItemTitle>
                      <Text className="text-sm font-medium text-foreground">
                        {durationSecondsValue}s
                      </Text>
                    </View>
                    <ListGroup.ItemDescription className="mb-3">
                      {t("settings.lastfm.minimumTrackDurationDescription")}
                    </ListGroup.ItemDescription>
                    <Slider
                      minValue={10}
                      maxValue={120}
                      step={5}
                      value={durationSecondsValue}
                      onChange={(value) =>
                        setDurationSecondsValue(getSliderNumericValue(value, 30))
                      }
                      onChangeEnd={(value) =>
                        void handleMinimumDurationChangeEnd(getSliderNumericValue(value, 30))
                      }
                    >
                      <Slider.Track className="h-2 rounded-full bg-border">
                        <Slider.Fill className="rounded-full bg-accent" />
                        <Slider.Thumb />
                      </Slider.Track>
                    </Slider>
                  </ListGroup.ItemContent>
                </ListGroup.Item>
              </SettingsHighlight>
            </>
          )}
        </ListGroup>

        {state.isConnected ? (
          <ListGroup>
            <SettingsHighlight id="clearData">
              <ListGroup.Item onPress={handleForgetCredentials}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t("settings.lastfm.clearData")}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {t("settings.lastfm.clearDataDescription")}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>
              </ListGroup.Item>
            </SettingsHighlight>
          </ListGroup>
        ) : null}
      </SettingsScrollView>

      <BottomSheet isOpen={isAuthSheetOpen} onOpenChange={setIsAuthSheetOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            backgroundClassName="bg-surface"
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            enableBlurKeyboardOnGesture
          >
            {state.isConnected ? (
              <View className="gap-6 px-4">
                <View className="gap-1">
                  <Text className="text-lg font-semibold text-foreground">
                    {t("settings.lastfm.profileTitle")}
                  </Text>
                  <Text className="text-sm text-muted">{t("settings.lastfm.readyToScrobble")}</Text>
                </View>
                <View className="gap-1">
                  <Text className="text-xs font-medium uppercase tracking-wide text-muted">
                    Username
                  </Text>
                  <Text className="text-base font-medium text-foreground">
                    {state.username ?? t("settings.lastfm.connectedAccount")}
                  </Text>
                </View>
                <View className="gap-3 pt-2">
                  <Button variant="danger" onPress={handleDisconnect}>
                    {t("settings.lastfm.unlink")}
                  </Button>
                </View>
              </View>
            ) : (
              <View className="gap-6 px-4">
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    {t("settings.lastfm.username")}
                  </Text>
                  <BottomSheetInput
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    placeholder={t("settings.lastfm.usernamePlaceholder")}
                    returnKeyType="next"
                  />
                </View>
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    {t("settings.lastfm.password")}
                  </Text>
                  <BottomSheetInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    textContentType="password"
                    placeholder={t("settings.lastfm.passwordPlaceholder")}
                    returnKeyType="done"
                    onSubmitEditing={handleConnect}
                  />
                </View>
                <View className="gap-3 pt-4">
                  <Button onPress={handleConnect} isDisabled={isConnecting}>
                    {isConnecting ? t("settings.lastfm.connecting") : t("settings.lastfm.connect")}
                  </Button>
                </View>
              </View>
            )}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  )
}
