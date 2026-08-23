import { ListGroup } from "heroui-native"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

export function IntegrationsSettings() {
  const { t } = useTranslation()

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          <ListGroup.Item disabled>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t("settings.routes.lastfm.title")}</ListGroup.ItemTitle>
              <ListGroup.ItemDescription>
                {t("settings.routes.lastfm.description")}
              </ListGroup.ItemDescription>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScrollView>
  )
}
