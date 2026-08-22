import { ListGroup } from "heroui-native"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"

interface RestoreStepProps {
  stepTitle: string
  onRestore: () => void
}

export function RestoreStep({ stepTitle, onRestore }: RestoreStepProps) {
  const { t } = useTranslation()

  return (
    <View className="gap-2">
      <Text className="px-1 text-xs font-semibold uppercase text-muted">{stepTitle}</Text>
      <ListGroup>
        <ListGroup.Item onPress={onRestore}>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>{t("onboarding.restore.action")}</ListGroup.ItemTitle>
            <ListGroup.ItemDescription>
              {t("onboarding.restore.description")}
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix />
        </ListGroup.Item>
      </ListGroup>
    </View>
  )
}
