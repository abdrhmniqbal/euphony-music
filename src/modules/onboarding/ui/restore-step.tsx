import { Button, PressableFeedback } from "heroui-native"
import { ScrollView, Text, View } from "react-native"
import { useTranslation } from "react-i18next"

export default function RestoreStep({ onRestore, onSkip }: { onRestore: () => void; onSkip: () => void }) {
  const { t } = useTranslation()
  return (
    <ScrollView className="flex-1 bg-background px-4 py-6">
      <View className="gap-4">
        <Text className="text-3xl font-bold text-foreground">{t("onboarding.restore.title")}</Text>
        <Text className="text-base text-muted">{t("onboarding.restore.description")}</Text>
        <Button onPress={onRestore}>{t("onboarding.restore.action")}</Button>
        <PressableFeedback onPress={onSkip}>
          <Text className="text-center text-sm text-muted">{t("onboarding.restore.skip")}</Text>
        </PressableFeedback>
      </View>
    </ScrollView>
  )
}
