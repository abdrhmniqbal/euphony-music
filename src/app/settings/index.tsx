import { useStore } from '@nanostores/react'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { Button, Dialog, PressableFeedback, Switch } from 'heroui-native'
import * as React from 'react'
import { Linking, Platform, ScrollView, Text, View } from 'react-native'
import { useUniwind } from 'uniwind'

import LocalChevronRightIcon from '@/components/icons/local/chevron-right'
import { useThemeColors } from '@/hooks/use-theme-colors'
import {
  $autoScanEnabled,
  $indexerState,
  $trackDurationFilterConfig,
  ensureAutoScanConfigLoaded,
  ensureTrackDurationFilterConfigLoaded,
  forceReindexLibrary,
  getTrackDurationFilterLabel,
  setAutoScanEnabled,
} from '@/modules/indexer'

interface SettingItemProps {
  title: string
  description?: string
  onPress?: () => void
  showChevron?: boolean
  rightIcon?: React.ReactNode
  isDisabled?: boolean
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  onPress,
  showChevron = true,
  rightIcon,
  isDisabled = false,
}) => {
  const theme = useThemeColors()

  return (
    <PressableFeedback
      onPress={isDisabled ? undefined : onPress}
      className={`flex-row items-center bg-background px-6 py-4 ${
        isDisabled ? 'opacity-60' : 'active:opacity-70'
      }`}
    >
      <View className="flex-1 gap-1">
        <Text className="text-[17px] font-normal text-foreground">{title}</Text>
        {description
          ? (
              <Text className="text-[13px] leading-5 text-muted">{description}</Text>
            )
          : null}
      </View>
      <View className="flex-row items-center gap-2">
        {rightIcon}
        {showChevron && (
          <LocalChevronRightIcon
            fill="none"
            width={20}
            height={20}
            color={theme.muted}
          />
        )}
      </View>
    </PressableFeedback>
  )
}

interface SectionHeaderProps {
  title: string
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View className="px-6 pt-8 pb-3">
    <Text className="text-[13px] font-medium tracking-wider text-muted uppercase">
      {title}
    </Text>
  </View>
)

interface SettingSection {
  title: string
  items: {
    id: string
    title: string
    description?: string
    route?: string
    action?: 'forceReindex' | 'openBatteryOptimizationSettings'
    showChevron?: boolean
  }[]
}

const SETTINGS_SECTIONS: SettingSection[] = [
  {
    title: 'Interface',
    items: [
      {
        id: 'appearance',
        title: 'Appearance',
        route: '/settings/appearance',
      },
    ],
  },
  {
    title: 'Library',
    items: [
      {
        id: 'folder-filters',
        title: 'Folder Filters',
        route: '/settings/folder-filters',
      },
      {
        id: 'track-duration-filter',
        title: 'Track Duration Filter',
        route: '/settings/track-duration-filter',
      },
      {
        id: 'auto-scan',
        title: 'Auto Scan',
        showChevron: false,
      },
      {
        id: 'force-reindex',
        title: 'Reindex Library',
        description: 'Re-scan all tracks, including unchanged files.',
        action: 'forceReindex',
        showChevron: false,
      },
      {
        id: 'battery-optimization',
        title: 'Disable Battery Optimization',
        action: 'openBatteryOptimizationSettings',
      },
    ],
  },
]

export default function SettingsScreen() {
  const router = useRouter()
  const { theme: currentTheme, hasAdaptiveThemes } = useUniwind()
  const indexerState = useStore($indexerState)
  const autoScanEnabled = useStore($autoScanEnabled)
  const trackDurationFilterConfig = useStore($trackDurationFilterConfig)
  const [showReindexDialog, setShowReindexDialog] = React.useState(false)

  const currentAppearance = hasAdaptiveThemes
    ? 'System'
    : currentTheme === 'dark'
      ? 'Dark'
      : 'Light'

  React.useEffect(() => {
    void ensureAutoScanConfigLoaded()
    void ensureTrackDurationFilterConfigLoaded()
  }, [])

  function handleItemPress(item: SettingSection['items'][number]) {
    if (item.action === 'forceReindex') {
      setShowReindexDialog(true)
      return
    }

    if (item.action === 'openBatteryOptimizationSettings') {
      void openBatteryOptimizationSettings()
      return
    }

    if (item.route) {
      router.push(item.route as never)
    }
  }

  async function openBatteryOptimizationSettings() {
    const appPackage = Constants.expoConfig?.android?.package

    try {
      if (Platform.OS !== 'android') {
        await Linking.openSettings()
        return
      }

      if (appPackage) {
        try {
          await Linking.sendIntent(
            'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
            [
              {
                key: 'android.provider.extra.APP_PACKAGE',
                value: appPackage,
              },
            ],
          )
          return
        }
        catch {
          // Fall through to settings list.
        }
      }

      await Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS')
      return
    }
    catch {
      // Fallback to app settings.
    }

    await Linking.openSettings()
  }

  function getItemDescription(itemId: string): string | undefined {
    switch (itemId) {
      case 'appearance':
        return `Current: ${currentAppearance}`
      case 'force-reindex':
        return indexerState.isIndexing
          ? 'Indexing in progress...'
          : 'Re-scan all tracks, including unchanged files.'
      case 'folder-filters':
        return 'Whitelist or blacklist specific folders.'
      case 'track-duration-filter':
        return getTrackDurationFilterLabel(trackDurationFilterConfig)
      case 'auto-scan':
        return autoScanEnabled
          ? 'Re-scan on app launch and when files change.'
          : 'Scan manually when needed.'
      case 'battery-optimization':
        return Platform.OS === 'android'
          ? 'Prevent background restrictions so indexing and playback stay reliable.'
          : 'Open system settings.'
      default:
        return undefined
    }
  }

  function handleConfirmForceReindex() {
    setShowReindexDialog(false)
    void forceReindexLibrary(true)
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {SETTINGS_SECTIONS.map(section => (
          <View key={section.title}>
            <SectionHeader title={section.title} />
            {section.items.map(item => (
              <SettingItem
                key={item.id}
                title={item.title}
                description={item.description ?? getItemDescription(item.id)}
                onPress={
                  item.id === 'auto-scan' ? undefined : () => handleItemPress(item)
                }
                showChevron={item.showChevron !== false}
                rightIcon={
                  item.id === 'auto-scan'
                    ? (
                        <Switch
                          isSelected={autoScanEnabled}
                          onSelectedChange={(isSelected) => {
                            void setAutoScanEnabled(isSelected)
                          }}
                        />
                      )
                    : undefined
                }
                isDisabled={item.id === 'force-reindex' && indexerState.isIndexing}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      <Dialog isOpen={showReindexDialog} onOpenChange={setShowReindexDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-4">
            <View className="gap-1.5">
              <Dialog.Title>Force reindex library?</Dialog.Title>
              <Dialog.Description>
                This will re-scan all music files, including already indexed and
                unchanged files. It may take longer than normal indexing.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" onPress={() => setShowReindexDialog(false)}>
                Cancel
              </Button>
              <Button onPress={handleConfirmForceReindex}>Reindex</Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
