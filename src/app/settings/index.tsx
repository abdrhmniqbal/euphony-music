import { useStore } from '@nanostores/react'
import { useRouter } from 'expo-router'
import { Button, Dialog, PressableFeedback } from 'heroui-native'
import * as React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useUniwind } from 'uniwind'

import LocalChevronRightIcon from '@/components/icons/local/chevron-right'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { $indexerState, forceReindexLibrary } from '@/modules/indexer'

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
    action?: 'forceReindex'
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
        id: 'force-reindex',
        title: 'Reindex Library',
        description: 'Re-scan all tracks, including unchanged files.',
        action: 'forceReindex',
        showChevron: false,
      },
    ],
  },
]

export default function SettingsScreen() {
  const router = useRouter()
  const { theme: currentTheme, hasAdaptiveThemes } = useUniwind()
  const indexerState = useStore($indexerState)
  const [showReindexDialog, setShowReindexDialog] = React.useState(false)

  const currentAppearance = hasAdaptiveThemes
    ? 'System'
    : currentTheme === 'dark'
      ? 'Dark'
      : 'Light'

  function handleItemPress(item: SettingSection['items'][number]) {
    if (item.action === 'forceReindex') {
      setShowReindexDialog(true)
      return
    }

    if (item.route) {
      router.push(item.route as never)
    }
  }

  function getItemDescription(itemId: string): string | undefined {
    switch (itemId) {
      case 'appearance':
        return `Current: ${currentAppearance}`
      case 'force-reindex':
        return indexerState.isIndexing
          ? 'Indexing in progress...'
          : 'Re-scan all tracks, including unchanged files.'
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
                onPress={() => handleItemPress(item)}
                showChevron={item.showChevron !== false}
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
