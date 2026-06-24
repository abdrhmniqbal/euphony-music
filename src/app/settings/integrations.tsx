import { ListGroup } from "heroui-native"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"

export default function IntegrationsSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          <ListGroup.Item onPress={() => router.push("/settings/lastfm")}>
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
